import { getStore } from '@netlify/blobs';
import { v4 as uuidv4 } from 'uuid';

function getEventStream(input) {
  const stream = [
    {
      state: "submitted",
      jobs: [],
      plans: [],
      __delay: 100,
    },
    {
      state: "working",
      jobs: [],
      plans: [
        {
          id: "mock-job-id-1",
          instruction: "Say hello to the world",
        },
        {
          id: "mock-job-id-2",
          instruction: "Say thank you",
        },
      ],
      __delay: 100,
    },
    {
      jobs: [
        {
          id: "mock-job-id-1",
          state: "submitted",
          instruction: "Say hello to the world",
          // tag: "hello-tool",
        },
      ],
      __delay: 500,
    },
    {
      jobs: [
        {
          id: "mock-job-id-1-a",
          state: "working",
          parent: ["mock-job-id-1"],
        },
        {
          id: "mock-job-id-1-b",
          state: "working",
          parent: ["mock-job-id-1"],
        },
      ],
      __delay: 500,
    },
    {
      jobs: [
        {
          id: "mock-job-id-1-a",
          state: "working",
          messages: [
            {
              role: "assistant",
              parts: [
                {
                  type: "text",
                  text: "Hello",
                },
              ],
            },
          ],
        },
        {
          id: "mock-job-id-1-b",
          messages: [
            {
              role: "assistant",
              parts: [
                {
                  type: "text",
                  text: "How",
                },
              ],
            },
          ],
        },
      ],
      __delay: 500,
    },
    {
      jobs: [
        {
          id: "mock-job-id-1-a",
          state: "working",
          messages: [
            {
              role: "assistant",
              parts: [
                {
                  type: "text",
                  text: " world",
                },
              ],
            },
          ],
        },
        {
          id: "mock-job-id-1-b",
          messages: [
            {
              role: "assistant",
              parts: [
                {
                  type: "text",
                  text: " are",
                },
              ],
            },
          ],
        },
      ],
      __delay: 500,
    },
    {
      jobs: [
        {
          id: "mock-job-id-1-b",
          messages: [
            {
              role: "assistant",
              parts: [
                {
                  type: "text",
                  text: " you?",
                },
              ],
            },
          ],
        },
      ],
      __delay: 500,
    },
    {
      jobs: [
        {
          id: "mock-job-id-1",
          state: "completed",
        },
        {
          id: "mock-job-id-1-a",
          state: "completed",
        },
        {
          id: "mock-job-id-1-b",
          state: "completed",
        },
        {
          id: "mock-job-id-2",
          parent: ["mock-job-id-1-a", "mock-job-id-1-b"],
          state: "submitted",
          instruction: "Say thank you",
          // tag: "thank-you-tool",
        },
      ],
      __delay: 500,
    },
    // {
    //   jobs: [
    //     {
    //       id: "mock-job-id-2",
    //       messages: [
    //         {
    //           role: "assistant",
    //           parts: [
    //             {
    //               type: "text",
    //               text: "Fine",
    //             },
    //             {
    //               type: "text",
    //               text: ", thank you!",
    //             },
    //           ],
    //         },
    //       ],
    //     },
    //   ],
    //   __delay: 500,
    // },
    // {
    //   jobs: [
    //     {
    //       id: "mock-job-id-2",
    //       messages: [
    //         {
    //           role: "assistant",
    //           parts: [
    //             {
    //               type: "text",
    //               text: " And you?",
    //             },
    //           ],
    //         },
    //       ],
    //     },
    //   ],
    //   __delay: 100,
    // },
    {
      state: "input-required",
      jobs: [
        {
          id: "mock-job-id-2",
          state: "input-required",
          toolCall: {
            name: "ask_user_confirm",
            arguments: {
              question: "Fine, thank you! And you?",
            }
          },
        },
      ],
    },
  ];

  if (input) {
    stream.splice(
      stream.length - 1,
      1,
      {
        state: "working",
        jobs: [
          {
            id: "mock-job-id-2",
            state: "working",
            toolCall: {
              name: "ask_user_confirm",
              arguments: {
                question: "Fine, thank you! And you?",
              }
            },
            messages: [
              {
                role: "user",
                parts: [
                  {
                    type: "text",
                    text: input,
                  },
                ],
              },
            ],
          },
        ],
        __delay: 500,
      },
      // {
      //   jobs: [
      //     {
      //       id: "mock-job-id-2",
      //       state: "working",
      //       messages: [
      //         {
      //           role: "assistant",
      //           parts: [
      //             {
      //               type: "text",
      //               text: "Alright alright",
      //             },
      //           ],
      //         },
      //       ],
      //     },
      //   ],
      //   __delay: 500,
      // },
      {
        // plans: [],
        jobs: [
          {
            id: "mock-job-id-2",
            state: "completed",
            // messages: [
            //   {
            //     role: "assistant",
            //     parts: [
            //       {
            //         type: "text",
            //         text: " alright.",
            //       },
            //     ],
            //   },
            // ],
          },
          {
            id: "mock-job-id-3",
            state: "submitted",
            parent: ["mock-job-id-2"],
            instruction: "Say goodbye",
          },
        ],
        __delay: 500,
      },
      {
        jobs: [
          {
            id: "mock-job-id-3",
            state: "working",
            messages: [
              {
                role: "assistant",
                parts: [
                  {
                    type: "text",
                    text: "Goodbye",
                  },
                ],
              }
            ],
          }
        ],
        __delay: 500,
      },
      {
        state: "completed",
        jobs: [
          {
            id: "mock-job-id-3",
            state: "completed",
          }
        ]
      },
    );
  }

  return stream;
}

function mergeJob(previousJob, patch) {
  const { messages, ...restPatch } = patch;

  if (messages) {
    restPatch.messages = [...(previousJob.messages ?? []), ...messages];
  }

  Object.assign(previousJob, restPatch);
}

export async function initializeTask(requirement) {
  const id = uuidv4();

  const store = getStore("tasks");

  const task = {
    id,
    requirement,
    cursor: 0,
  };

  await store.setJSON(id, task);

  return task;
}

export function run(task) {
  console.log("running", task.id);
  const store = getStore("tasks");
  let cursor = task.cursor;
  return new Promise((resolve, reject) => {
    const next = async () => {
      cursor++;
      const allEventStream = getEventStream(task.input);
      const done = cursor >= allEventStream.length - 1;
      await store.setJSON(task.id, {
        ...task,
        cursor,
      });

      console.log("progressing", task.id, cursor, done);

      if (done) {
        resolve();
      } else {
        const last = allEventStream[allEventStream.length - 1];
        setTimeout(next, (last.__delay ?? 500));
      }
    }
    next();
  });
}

export function getMergedTask({ cursor, input, ...taskMetadata }, previousTask) {
  const allEventStream = getEventStream(input);
  const task = allEventStream
    .slice((previousTask?.cursor ?? -1) + 1, cursor + 1)
    .reduce((acc, event) => {
      const { jobs: jobsPatch, __delay, ...restEvent } = event;

      if (jobsPatch) {
        const jobs = acc.jobs?.slice() ?? [];
        const previousJobsMap = new Map(jobs.map((job) => [job.id, job]));

        for (const patch of jobsPatch) {
          const previousJob = previousJobsMap.get(patch.id);
          if (previousJob) {
            mergeJob(previousJob, patch);
          } else {
            jobs.push(patch);
          }
        }

        restEvent.jobs = jobs;
      }

      return { ...acc, ...restEvent };
    }, taskMetadata);

  return {
    done: cursor === allEventStream.length - 1,
    value: task,
  };
}
