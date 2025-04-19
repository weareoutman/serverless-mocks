// @ts-check
import { startTask } from "./mock-task.mjs";

const CORSHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*",
  "Access-Control-Allow-Methods": "*",
};

/**
 * @param {Request} req
 * @return {Promise<Response>} response
 */
export default async function sendTask(req) {
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

  if (typeof body.requirement !== "string") {
    return new Response("Bad Request", {
      status: 400,
      statusText: "Bad Request",
      headers: {
        ...CORSHeaders,
      },
    });
  }

  const task = startTask(body.requirement);

  return new Response(
    JSON.stringify(task),
    {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache",
        ...CORSHeaders,
      }
    },
  );
}
