# pixeltron-server
socket io server in typescript

# Deploying

A project depending on pixeltron-server can then write code that extends pixeltron-server.GameServer
src/config: overall config files
src/config/dev and src/config/prod: supply a .env file and config.json file, something like:

##.env:
'''
    #port for main server to run on
    PORT=3001
    MONITORPORT=3002
    #how long before socket clients disconnect with no activity
    WS_TIMEOUT=5000
    #how often do clients ping the server
    WS_INTERVAL=2000

    #server tick rate of one second
    SERVERTICKRATE = 250

    OPEN_CAGE_DATA_KEY=8c0892514e884f09af7c09a9b067b02b
    PATH_PM_MONITOR=./node_modules/pm2-server-monitor/webUI/

    # *** Which mode is NODE_ENV running in? ***
    #NODE_ENV=production
    NODE_ENV=development

    # *** Debugging socket *** #
    #DEBUG=socket.io*
'''

##config.json:
'''
{
    "gamepaths": {
        "/game": ["public", "game"],
        "/public": ["public"],
        "/tests": ["tests"],
        "/tests/coverage/": ["tests", "lcov-report"]
    },
    "monitorpaths": {
        "views": ["public"],
        "/js": ["public", "js"]
    },
    "resources": [
        ["src/res", "dist/public"],
        ["client/dist/webgl", "dist/public/game"]
    ]
}
'''

Your server.ts file can then look something like this:

##server.ts:
'''
import * as path from "path";
import { PixeltronServer } from 'pixeltron-server';
import { ServerConfig } from 'pixeltron-server';
import { copyResources } from 'pixeltron-server';
import yargs from "yargs";

//Copy our config dir
copyResources([["src/config/dev/", "dist/config/"]]);
let sconfig = ServerConfig(path.join(__dirname, 'config', '.env'), path.join(__dirname, 'config', 'config.json') );
if (sconfig.ENV.NODE_ENV == 'development')
{
  console.log("DEVELOPMENT MODE: CONFIG");
  console.log(sconfig);
}

import {RuinsServer} from "./ruins/RuinsServer";

let gamepaths = {};
for (let gamepath in sconfig.gamepaths)
{
  gamepaths[gamepath] = path.join(__dirname, ...sconfig.gamepaths[gamepath] );
}

let monitorpaths = {};
for (let monitorpath in sconfig.monitorpaths)
{
  monitorpaths[monitorpath] = path.join(__dirname, ...sconfig.monitorpaths[monitorpath] );
}

const argv = yargs.options(
  {
    env: 
    {
      alias: 'e',
      choices: ['dev', 'prod'] as const,
      demandOption: true,
      description: "app environment (prod or dev)"
    },
    stage:
    {
      alias: 's',
      type: 'boolean',
      default: false,
      description: 'stage assets before running'
    }
  }
).argv;
//console.log(argv);

if (argv.stage == true)
{
  console.log("SHould do staging setup");
  copyResources(sconfig.resources);
}

if (argv.env == 'dev')
{
  console.log("Development setup here");
}
else if (argv.env == 'prod')
{
  console.log("Prod setup here");
}


let MakeServer = (router: any, httpserver: any, port: number|string) : RuinsServer =>
{
  return new RuinsServer(router, httpserver, port);
}

let p = new PixeltronServer(gamepaths, monitorpaths);
p.start(sconfig.PORT, sconfig.MONITORPORT, MakeServer);


'''

You will also need a res directory for resources, with:
res/js
    -jquery, jquery sparkline, socket.io
- a status.ejs file for the monitor server. See sample.status.ejs in the config dir.

## Development
Setting this up came from: https://itnext.io/production-ready-node-js-rest-apis-setup-using-typescript-postgresql-and-redis-a9525871407

First of all, we're using tsc-watch as a dev tool (see package.json) - this means we can run 

node run dev

and the code will autocompile into dist every time we save a change. To do this, we needed to create a tsconfig.json file which configures a few things, notably that sourcemaps should be generated and that the output should go in the dist directory.
As this is a module, types need to be generated so we need declaration: true

Rather than having a massive server.ts file, we separate out functionality into the following directories:
- config (config variables for the system)
- middleware (error handling entry points, docs, cors, compression, )
- services ( functionality, external services, also contains routes)
- utils ( error implementations)

The dotenv npm module is installed for env variables.
Swagger is installed for documenting the api, documentation goes in swagger.json

Jest is used for mocking in unit tests. Test definitions are in xxx.test.ts files alongside the implementations. Run tests with npm run test, which is configured in package.json - see the jest section for how the jest tests are run. To implement new tests, remember to test what you can control and mock what you can't - use jest.mock("module name") or jest.fn() to mock the return of a function, and test your code with expects type lines.

Integration tests are done with the supertest module, which allows us to mock out things like external network endpoints (rather than never calling them), so that you are testing your full routes/middleware/exception handling.

Note: exceptions still seem to be thrown, this is probably desired behaviour ( to test your exception handling code! ), but it does make big yellow lines on the console.

Clustering and load balancing are done with PM2. Config goes in a pm2.json file in the config directory.
Monitoring is via the pm2-server-monitor package and requires a little config inside server.ts, and then
(unfortunately) a static route to the node_modules webUI in that package. There's also (very unfortunately) a
config.js file there which specifies server groups and needs to match the name/port in server.ts. Would be great to
circumvent this or rewrite it (the page doesn't even have graphs).

If started with the 'run start' commend (thus firing up processes) then you can monitor at url:port/status/index.html

Summary of commands
npm run test-full (gives a html coverage report)
npm run test (just runs the tests)
npm run dev (tsc-watch will recompile changes)
npm run builf (will build, run tests, gen doc)
npm run start (load balanced)
npx run stop (stop all started processes)

Logging
Followed: https://stackify.com/winston-logging-tutorial/
Actually that wasn't great.
Look at https://www.digitalocean.com/community/tutorials/how-to-use-winston-to-log-node-js-applications and https://thisdavej.com/using-winston-a-versatile-logging-library-for-node-js/ but will need to convert from js to ts
Might be able to hook up to https://www.npmjs.com/package/winstond

Database:
- beginning by using sqlite (npm install sqlite )
Using typeorm, and therefore we need to update tsconfig.json: see https://levelup.gitconnected.com/complete-guide-to-using-typeorm-and-typescript-for-data-persistence-in-node-js-module-bfce169959d9

Converting dev code to a Module:
https://itnext.io/step-by-step-building-and-publishing-an-npm-typescript-package-44fe7164964c
https://medium.com/cameron-nokes/the-30-second-guide-to-publishing-a-typescript-package-to-npm-89d93ff7bccd
Linting:
https://www.robertcooper.me/using-eslint-and-prettier-in-a-typescript-project
npm-link:
https://medium.com/dailyjs/how-to-use-npm-link-7375b6219557





Notes:
for now: 
- tests with coverage are running with "build", "dev" is without tests
- we're not linting. There are too many errors and they slowed me down.
- we're using strict: false in tsconfig. It would be nice to not do this, but there may be reasons we can't like typeorm which I'm not even using yet. It may also require output to ES5 instead of ES2017, and I'd wory about losing the use of async, which some things need to use

URLS:
=====
see the game in: URL:PORT/game (port is 3001 by default)
see the monitor in URL:MONITORPORT/ (monitorport is 3002 by default)
see the test summary in URL:PORT/tests/index.html
see the test coverage in URL:PORT/tests/coverage/index.html
