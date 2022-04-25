import {
  EventBridgeClient,
  PutEventsCommand,
} from "@aws-sdk/client-eventbridge";
import { v4 as uuidv4 } from "uuid";

export const handler = async (events: {
  EndpointId: string;
}): Promise<void | Error> => {
  const detail = {
    id: uuidv4(),
    date: Date.now(),
  };

  const client = new EventBridgeClient({
    region: process.env.AWS_REGION!,
  });

  const command = new PutEventsCommand({
    EndpointId: events.EndpointId,
    Entries: [
      {
        Detail: JSON.stringify(detail),
        DetailType: "put-events-to-global-endpoints",
        EventBusName: process.env.EVENT_BUS_NAME!,
        Source: "global-endpoints-test.non-97.net",
      },
    ],
  });

  const response = await client.send(command);

  console.log(response);

  return;
};
