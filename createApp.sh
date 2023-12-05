#!/bin/sh
set -e

ELECTRON_WIN="https://github.com/electron/electron/releases/download/v27.1.2/electron-v27.1.2-win32-x64.zip"
electron_win_ok() {
  echo '219ba87333c8f799badfcf2daceec7a23fa3f76d *electron_win.zip' | shasum -cs
}

ELECTRON_LINUX="https://github.com/electron/electron/releases/download/v27.1.2/electron-v27.1.2-linux-x64.zip"
electron_linux_ok() {
  echo 'f06cc8fe6b84f30fcc981c04d286e8664820363e *electron_linux.zip' | shasum -cs
}

FRONTEND="6d6gui"
BACKEND="electron-app"
APP_WIN="6d6gui-win"
APP_LINUX="6d6gui-linux"


main() {
  (download_electron)

  (build_frontend)
  (build_backend)

  (prepare_electron_win)
  (package_app_win)

  (prepare_electron_linux)
  (package_app_linux)
}

build_frontend() {
  cd "$FRONTEND"
  npm run build
}

build_backend() {
  cd "$BACKEND"
  tsc
}

prepare_electron_win() {
  rm -rf "$APP_WIN"
  mkdir "$APP_WIN"
  cd "$APP_WIN"
  unzip ../electron_win.zip
  mkdir -p resources/app/frontend
}

prepare_electron_linux() {
  rm -rf "$APP_LINUX"
  mkdir "$APP_LINUX"
  cd "$APP_LINUX"
  unzip ../electron_linux.zip
  mkdir -p resources/app/frontend
}

package_app_win() {
  cp -r "$FRONTEND/build/"* "$APP_WIN/resources/app/frontend/"
  cp -r "$BACKEND/dist/"* "$APP_WIN/resources/app/"
  cp "$BACKEND/templates/package.json" "$APP_WIN/resources/app/"
  mv "$APP_WIN/electron.exe" "$APP_WIN/6d6gui-win.exe"
}


package_app_linux() {
  cp -r "$FRONTEND/build/"* "$APP_LINUX/resources/app/frontend/"
  cp -r "$BACKEND/dist/"* "$APP_LINUX/resources/app/"
  cp "$BACKEND/templates/package.json" "$APP_LINUX/resources/app/"
  mv "$APP_LINUX/electron" "$APP_LINUX/6d6gui-linux"
}

download_electron() {
  if ! electron_win_ok
  then
    curl -L "$ELECTRON_WIN" > electron_win.zip
    if ! electron_win_ok
    then
      echo Download failed for win version - incorrect checksum!
      exit 1
    fi
  fi
  if ! electron_linux_ok
  then
    curl -L "$ELECTRON_LINUX" > electron_linux.zip
    if ! electron_linux_ok
    then
      echo Download failed for linux version - incorrect checksum!
      exit 1
    fi
  fi
}

main
