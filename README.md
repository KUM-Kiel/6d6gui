# Graphical Interface for the 6d6-Compatibility Tools

This desktop application is meant to replace 6d6-compat. As of right now `6d6segy` is the only function supported on all operating systems.

Current avaiability of functions for operating systems:

* `6d6segy`: Windows, Linux
* `6d6mseed`: Linux
* `6d6copy`: Linux
* `6d6read`: Linux

## Installation Instruction

1.  Make sure you've installed the latest [Node Release](https://nodejs.org/en)
2.  Download the latest release of 6d6gui.
3.  Go into the main folder of 6d6gui.
4.  Run `npm install`.
5.  Run the `createApp.sh` **bash**-script.
6.  The script will install the correct version for the type of system you're running.
7.  **Windows**: Run `6d6gui-win.exe`.\
    **Linux**: Run `6d6gui-linux`.

### Note

* Please keep in mind that the current release is pre-alpha.
* The Script will install a separate version for both operating systems.
* Future releases will extend the supported operating systems with conversions like `6d6mseed`.
* Scripted use of `6d6segy` is also in development.
* A version for MacOs is planned, but not yet available.
* We're thankful for every constructive criticism and if you have an idea for future functionalities, please contact us at `kum@kum-kiel.de`.

### Shotfile Structure

A **Shotfile** has to have the following structure:

Profile  | Shot      | Time                        | Latitude | Longitude | Water Depth | Source Depth | Distance
---------|-----------|-----------------------------|----------|-----------|-------------|--------------|---------
20202013 | 0001      | 2013-02-20T01:27:12.477000Z |  54.326  |  10.179   | 4           | 4            | 335

The coordinates go by the WGS84 System in decimal degrees.

We *have* to go by a specified structure due to the unlimited possible variants of structuring this file.

Profile, Water Depth, Source Depth and Distance are optional.

## Licence

The program is published under the terms of the GNU GPL 3.0. See the `LICENCE` file.

Some parts of the program incorporate public domain or BSD licensed code.
