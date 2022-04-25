#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { GlobalEndpointsStack } from "../lib/global-endpoints-stack";

const envUS = { region: "us-east-1", account: process.env.CDK_DEFAULT_ACCOUNT };
const envJP = {
  region: "ap-northeast-1",
  account: process.env.CDK_DEFAULT_ACCOUNT,
};

const app = new cdk.App();

new GlobalEndpointsStack(app, "GlobalEndpointsStackUS", {
  env: envUS,
});
new GlobalEndpointsStack(app, "GlobalEndpointsStackJP", {
  env: envJP,
});
