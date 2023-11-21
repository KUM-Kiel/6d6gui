#!/bin/sh
set -e

ELECTRON="https://github.com/electron/electron/releases/download/v27.1.0/electron-v27.1.0-win32-x64.zip"

FRONTEND="6d6gui"
BACKEND="electron-app"
APP="6d6gui-out"

main() {
  (build_frontend)
  (build_backend)
  (download_electron)
  (prepare_electron)
  (package_app)
}

build_frontend() {
  cd "$FRONTEND"
  npm run build
}

build_backend() {
  cd "$BACKEND"
  tsc
}

prepare_electron() {
  rm -rf "$APP"
  mkdir "$APP"
  cd "$APP"
  unzip ../electron.zip
  mkdir -p resources/app/frontend
}

package_app() {
  rm -rf app
  mkdir -p app/frontend
  cp -r "$FRONTEND/build/"* "$APP/resources/app/frontend/"
  cp -r "$BACKEND/dist/"* "$APP/resources/app/"
  cp "$BACKEND/templates/package.json" "$APP/resources/app/"
  mv "$APP/electron.exe" "$APP/6d6gui.exe"
}

download_electron() {
  curl -L "$ELECTRON" > electron.zip
}

main
