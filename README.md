# vault-secret-editor

[![NodeJS build App](https://github.com/SomeBlackMagic/vault-secret-editor/actions/workflows/npm-build-app.yml/badge.svg)](https://github.com/SomeBlackMagic/vault-secret-editor/actions/workflows/npm-build-app.yml)


## How to install for linux
```
wget https://github.com/SomeBlackMagic/vault-secret-editor/releases/latest/download/vault-secret-editor-linux-x64
chmod +x vault-secret-editor-linux-x64
mv vault-secret-editor-linux-x64 /usr/local/bin/vault-secret-editor
```

## How to use

For correctly work application - in system need to install Safe binary app: https://github.com/Qarik-Group/safe
After install you need to log in into vault
```bash
safe target https://vault.company.com:8200/ instance-name
safe auth
<enter token>
```

After that you can use binary
```text
  vault-secret-editor download [instance] [path]   download all changes(by key) to local fs
  vault-secret-editor checkDiff [instance] [path]  display diff local and remote changes
  vault-secret-editor apply [instance] [path]      apply local changes to remote vault
```