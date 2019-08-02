import { JsonObject } from '@angular-devkit/core';
import { BuilderOutput, BuilderContext } from '@angular-devkit/architect';
import * as childProcess from 'child_process';
import { dasherize } from '@angular-devkit/core/src/utils/strings';

export function runCloudformationCommand(
    options: JsonObject,
    context: BuilderContext,
    subcommand: string
) {
    return new Promise<BuilderOutput>((resolve, reject) => {
        const args: string[] = ['cloudformation', subcommand];
        Object.keys(options).forEach(arg => {
            const value = options[arg];
            if (value) {
                if (Array.isArray(value)) {
                    args.push(`--${dasherize(arg)}`);
                    // todo: avoid this cast to Array<string>
                    args.push(...(value as Array<string>));
                } else if (typeof value === 'object') {
                    const keys = Object.keys(value);
                    if (keys.length > 0) {
                        args.push(`--${dasherize(arg)}`);
                        keys.forEach(key => {
                            // todo: avoid this cast to any
                            args.push(`${key}=${(value as any)[key]}`);
                        });
                    }
                } else if (typeof value === 'boolean') {
                    args.push(`--${dasherize(arg)}`);
                    // do nothing - just including the flag is all that's required
                } else {
                    args.push(`--${dasherize(arg)}`);
                    args.push(`${value}`);
                }
            }
        });
        const command = `aws`;
        context.logger.log(
            'info',
            `Executing "${command} ${args.join(' ')}"...`
        );
        context.reportStatus(`Executing "${command} ${args[0]} ${args[1]}"...`);
        const child = childProcess.spawn(command, args, {
            stdio: 'pipe',
            env: process.env
        });

        child.stdout.on('data', data => {
            context.logger.info(data.toString());
        });
        child.stderr.on('data', data => {
            context.logger.error(data.toString());
            reject();
        });

        context.reportStatus(`Done.`);
        child.on('close', code => {
            resolve({ success: code === 0 });
        });
    });
}
