import {
  Duration,
  Stack,
  StackProps,
  aws_events as events,
  aws_events_targets as targets,
  aws_stepfunctions as sfn,
  aws_lambda as lambda,
  aws_lambda_nodejs as nodejs,
  aws_iam as iam,
  aws_logs as logs,
} from "aws-cdk-lib";
import { Construct } from "constructs";
import * as path from "path";

export class GlobalEndpointsStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // Event Bridge Event Bus for Global endpoints
    const globalEndpointsEventBus = new events.EventBus(
      this,
      "GlobalEndpointsEventBus",
      {
        eventBusName: "globalEndpointsBus",
      }
    );

    globalEndpointsEventBus.archive("GlobalEndpointsBusArchive", {
      archiveName: "globalEndpointsEventBusArchive",
      description: "globalEndpointsEventBus Archive",
      eventPattern: {
        account: [Stack.of(this).account],
      },
      retention: Duration.days(3),
    });

    // State Machine that is the target of the Event Bridge Rule
    const stateMachine = new sfn.StateMachine(this, "StateMachine", {
      definition: new sfn.Pass(this, "Pass"),
    });

    // Event Bridge Rule for Global endpoints
    new events.Rule(this, "GlobalEndpointsRule", {
      eventBus: globalEndpointsEventBus,
      eventPattern: {
        account: [Stack.of(this).account],
      },
      targets: [new targets.SfnStateMachine(stateMachine)],
    });

    new nodejs.NodejsFunction(this, "PutEventsToGlobalEndpointsFunction", {
      entry: path.join(
        __dirname,
        "../src/lambda/handlers/put-events-to-global-endpoints.ts"
      ),
      runtime: lambda.Runtime.NODEJS_14_X,
      bundling: {
        minify: true,
        sourceMap: true,
        nodeModules: ["aws-crt"],
      },
      environment: {
        EVENT_BUS_NAME: globalEndpointsEventBus.eventBusName,
        REGION: this.region,
        NODE_OPTIONS: "--enable-source-maps",
      },
      role: new iam.Role(this, "PutEventsToGlobalEndpointsFunctionIamRole", {
        assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
        managedPolicies: [
          iam.ManagedPolicy.fromAwsManagedPolicyName(
            "service-role/AWSLambdaBasicExecutionRole"
          ),
          new iam.ManagedPolicy(
            this,
            "PutEventsToGlobalEndpointsFunctionIamPolicy",
            {
              statements: [
                new iam.PolicyStatement({
                  effect: iam.Effect.ALLOW,
                  actions: ["events:PutEvents"],
                  resources: [`arn:aws:events:*:${this.account}:event-bus/*`],
                }),
              ],
            }
          ),
        ],
      }),
      logRetention: logs.RetentionDays.TWO_WEEKS,
      timeout: Duration.seconds(60),
      tracing: lambda.Tracing.ACTIVE,
    });
  }
}
