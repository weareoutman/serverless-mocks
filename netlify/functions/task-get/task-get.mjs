// @ts-check
import { getStore } from "@netlify/blobs";
import { CORSHeaders } from "../task-send/task-send.mjs";
import { getMergedTask } from "../task-send/task-server.mjs";

const encoder = new TextEncoder();

/**
 * @param {Request} req
 * @return {Promise<Response>} response
 */
export default async function taskGet(req) {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        ...CORSHeaders,
      },
    });
  }

  const url = new URL(req.url);
  const taskId = url.searchParams.get("id");

  if (!taskId || req.method !== "GET") {
    return new Response("Bad Request", {
      status: 400,
      statusText: "Bad Request",
      headers: {
        ...CORSHeaders,
      },
    });
  }

  const tasks = getStore("tasks");
  let previousTask = await tasks.get(taskId, { type: "json", consistency: "strong" });

  if (!previousTask) {
    return new Response("Task Not Found", {
      status: 404,
      statusText: "Not Found",
      headers: {
        ...CORSHeaders,
      },
    });
  }

  const readableStream = new ReadableStream({
    async start(controller) {
      const { done, value } = getMergedTask(previousTask);
      controller.enqueue(encoder.encode(`data: ${JSON.stringify(value)}\n\n`));

      const poll = async () => {
        const newTask = await tasks.get(taskId, { type: "json", consistency: "strong" });
        if (!newTask) {
          console.error("Task Not Found While Polling");
          controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
          controller.close();
          return;
        }

        if (newTask.cursor === previousTask.cursor) {
          setTimeout(poll, 100);
          return;
        }

        const { done, value } = getMergedTask(newTask, previousTask);
        previousTask = newTask
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(value)}\n\n`));

        if (done) {
          controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
          controller.close();
        } else {
          setTimeout(poll, 100);
        }
      };

      if (done) {
        controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
        controller.close();
      } else {
        setTimeout(poll, 100);
      }
    }
  });

  return new Response(readableStream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      ...CORSHeaders,
    },
  });
}
