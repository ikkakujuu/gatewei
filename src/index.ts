#!/usr/bin/env node

import { createServer, IncomingMessage } from 'http';
import path from 'path';
import cluster from 'cluster';
import { cpus } from 'os';

import express from 'express';
import helmet from 'helmet';
import httpProxy from 'http-proxy-middleware';
import pino from 'pino';
import fs from 'fs-extra';
import program from 'commander';
import httpStatus from 'http-status';

const app = express();
const server = createServer(app);

const logger = pino();

const pkgInfo = require('../package.json');

(async () => {
	try {
		// Default config path is <cwd/config.json>
		let configPath = path.resolve('config.json');

		program
			.version(pkgInfo.version, '-v, --version')
			.option('-c, --config <configPath>')
			.parse(process.argv);

		// Override default config file if it was supplied manually
		if (typeof program.configPath === 'string') {
			configPath = path.resolve(program.configPath);
		}

		// Check if config file exists
		const configExists = await fs.pathExists(configPath);
		if (!configExists) {
			throw new Error('Please supply a valid config file path');
		}

		const config = await fs.readJson(configPath);

		// Retrieve configuration values
		const serverPort = typeof config.serverPort === 'number' && !isNaN(config.serverPort) ? config.serverPort : 0;
		const services: any[] = Array.isArray(config.services) ? config.services : [];
		const serviceStore: any = {};

		services.forEach(service => (serviceStore[service.slug] = service));

		app.use(
			'/:serviceSlug',
			(req, res, next) => {
				// Assign service to request or fail
				const { serviceSlug } = req.params;

				if (typeof serviceSlug !== 'string' || typeof serviceStore[serviceSlug] === 'undefined') {
					return res.sendStatus(httpStatus.NOT_FOUND);
				}

				res.locals.serviceSlug = serviceSlug;

				next();
			},
			(req, res, next) => {
				// Compose proxy middleware with target path
				const { serviceSlug } = res.locals;
				const { target } = serviceStore[serviceSlug];

				// Remove service slug if configured (defaults to true)
				const routePath = config.removeRouteSlug === false ? req.originalUrl : req.originalUrl.replace(`/${serviceSlug}/`, '');

				// Assemble target url from base proxy target and current request
				const targetUrl = `${target}/${routePath}`;

				// Create and invoke proxy middleware (target will not only contain host but also final url to proxy to)
				// prependPath -> Adds path from target to proxy (won't happen by default)
				// ignorePath -> Ignore the route of the current request which would be used by default
				const proxy = httpProxy({ target: targetUrl, prependPath: true, ignorePath: true });
				proxy(req, res, next);
			}
		);

		// Create server socket workers
		if (cluster.isMaster) {
			for (let i = 0; i < cpus().length; i++) {
				cluster.fork();
			}

			cluster.on('exit', (worker, code, signal) => logger.warn(`Worker #${worker.process.pid} exited with ${code}: ${signal}`));
			cluster.on('listening', (worker, address) => logger.info(`Worker #${worker.process.pid} is listening on http://localhost:${address.port}`));
			return;
		}

		server.listen(serverPort);
	} catch (err) {
		logger.fatal(err);
		process.exit(1);
	}
})();
