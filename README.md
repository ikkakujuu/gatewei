<div align="center">
	<br>
	<img width="200" src="media/logo.svg" alt="gatewei">
	<br>
</div>
<h1 align="center">gatewei</h1>

> gate + 喂 (Chinese for "hello") = gatewei

## Short Description
Opinionated, dead-simple but powerful gateway for your microservice architecture. 
## Installation
**npm**
```
npm i -g gatewei
```
**yarn**
```
yarn global add gatewei
```
# Highlights
* :ok_hand: **Simple:** Get up and running with only a few steps
* :leaves: **Lightweight:** Low memory footprint, no unnecessary bloat
* :chart_with_upwards_trend: **Scalable:** Multithreaded load balancing already included

# Usage
1. Create a file called `config.json` or specify a path with the flag `--config`
2. Configure to your liking using the options below
3. Run `gatewei`

## Options

| Property | Description | Default |
| --- | --- | --- |
| `serverPort` | Port for gatewei to listen for incoming requests | *Required to be added manually* |
| `services` | Array of services to proxy requests for | `[]`
| `removeRouteSlug` | Remove prefix of service (e.g `/api/users` will become `/users`) | `true` |
| `clusterSize` | Specify number of threads to use | Count of CPU cores |
| `forceShutdownOnWorkerExit` | Shut down gatewei when worker exits unexpectedly | `false` |
| `restartWorkers` | Restart worker when it exits unexpectedly | `true` |
