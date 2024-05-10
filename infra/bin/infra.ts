#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import "source-map-support/register";
import { MainStack } from "../lib/main";

const app = new cdk.App();

new MainStack(app, "MainStack", {
  synthesizer: new cdk.DefaultStackSynthesizer({
    qualifier: "lcx",
  }),
});
