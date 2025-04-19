// @ts-check
import { getStore } from "@netlify/blobs";
import { CORSHeaders } from "../task-send/task-send.mjs";
import { getMergedTask, run } from "../task-send/task-server.mjs";

/**
 * @typedef {import("@netlify/functions").Context & { waitUntil: ((promise: Promise<unknown>) => void) }} Context
 */

/**
 * @param {Request} req
 * @param {Context} ctx
 * @return {Promise<Response>} response
 */
export default async function taskInput(req, ctx) {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        ...CORSHeaders,
      },
    });
  }

  if (req.method !== "POST") {
    return new Response("Not Found", {
      status: 404,
      statusText: "Not Found",
      headers: {
        ...CORSHeaders,
      },
    });
  }

  if (req.headers.get("content-type") !== "application/json") {
    return new Response("Bad Request", {
      status: 400,
      statusText: "Bad Request",
      headers: {
        ...CORSHeaders,
      },
    });
  }

  const body = await req.json();
  const { id: taskId, jobId, input} = body;

  if (typeof input !== "string") {
    return new Response("Bad Request", {
      status: 400,
      statusText: "Bad Request",
      headers: {
        ...CORSHeaders,
      },
    });
  }

  const tasks = getStore("tasks");
  const taskBlob = await tasks.get(taskId);

  if (!taskBlob) {
    return new Response("Task Not Found", {
      status: 404,
      statusText: "Not Found",
      headers: {
        ...CORSHeaders,
      },
    });
  }

  const taskMetadata = JSON.parse(taskBlob);
  const { value: { jobs } } = getMergedTask(taskMetadata);

  const job = jobs?.find((job) => job.id === jobId);
  if (!job) {
    return new Response("Job Not Found", {
      status: 404,
      statusText: "Not Found",
      headers: {
        ...CORSHeaders,
      },
    });
  }

  if (job.state !== "input-required") {
    return new Response("Job is not in input-required state", {
      status: 400,
      statusText: "Bad Request",
      headers: {
        ...CORSHeaders,
      },
    });
  }

  const newTask = {
    ...taskMetadata,
    cursor: taskMetadata.cursor - 1,
    input,
  };
  await tasks.set(taskId, JSON.stringify(newTask));

  ctx.waitUntil(run(newTask));

  return new Response(null, {
    status: 204,
    headers: {
      ...CORSHeaders,
    },
  });
}
