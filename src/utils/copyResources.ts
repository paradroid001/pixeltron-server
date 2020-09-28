import * as shell from 'shelljs';

// Copy all the view templates
//shell.cp('-R', 'src/res', 'dist/public');

//pass this function a list of 
//directory pairs to copy.
export const copyResources = (dirs: string[][] ) : void =>
{
    dirs.forEach( function (dirpair: string[])
    {
        console.log("copy " + dirpair[0] + " to " + dirpair[1]);
        shell.cp('-R', dirpair[0], dirpair[1]);
    });
}
