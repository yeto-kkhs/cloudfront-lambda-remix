# CloudFront - Lambda - Remix on Hono

## bootstrap

```sh
aws-vault exec ${xxx} -- pnpm -F @lcx/infra cdk bootstrap --qualifier ${yyy} --toolkit-stack-name ${zzz}
```

## deploy

```sh
#build
pnpm -F @lcx/lambda-app build

# deploy
aws-vault exec ${xxx} -- pnpm -F @lcx/infra cdk deploy
```