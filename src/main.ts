import { readFileSync, writeFileSync } from 'fs';
import axios, { AxiosResponse } from 'axios';
import array, { ceil } from 'lodash';

let batchNumber = 0;
let batchSize = 1000;

const secretData = readFileSync('src/assets/super-secret-data.txt', 'utf-8');
const secretDataArray = secretData.split('\n');

const chunksOfSecretData = (array.chunk(secretDataArray, ceil(batchSize))).slice(0,2);  // 101 chunks with aprox. 1000 elements in array

let requestPromises: Promise<AxiosResponse<any, any>>[] = [];

console.log('Total number of batches: ' + chunksOfSecretData.length);

const intervalID = setInterval(() => {

	let min = batchNumber * 1;
	let max = (batchNumber+1) * 1;
	batchNumber++

	chunksOfSecretData.slice(min, max).map((elements) => {
		let body = elements.map((el) => el.replace(/(\r\n|\n|\r)/gm, '').trim()); // cleaning 
		requestPromises.push(
			axios.post('https://txje3ik1cb.execute-api.us-east-1.amazonaws.com/prod/decrypt', body, {
					headers: {
					'Content-Type': 'application/json',
					'x-api-key': 'Q76n6BBoa46yWuxYL7By02KcKfOQz0kd9lVflIXZ'
					}
				})
			);
	})
	console.info('Processing batch: ' + batchNumber);

	if(max >= chunksOfSecretData.length) {
		// stopping the interval
		clearInterval(intervalID);

		Promise.allSettled(requestPromises).then((responses) => {
			if (responses.length > 0) {
				// keys for each galaxy
				let gxsk: Record<string, any> = [];

				// values (list of e) for each galaxy
				let gxsv: Record<string, any> = [];
				responses.forEach((response) => {
					if(response.status == 'fulfilled') {
						let resp = response.value.data; // response.data array of stringed objs
						let actors = resp.map((actor: any) => {
							return JSON.parse(actor);
						});
						let homeworlds = actors.reduce(function (cb: any, initial: any) {
							cb[initial.homeworld] = cb[initial.homeworld] || [];
							cb[initial.homeworld].push(initial.name);
							return cb;
						}, {});
						
						for (let homeworld in homeworlds) {
							gxsk.push(homeworld);
							gxsv.push(homeworlds[homeworld]);
						}
					}
				});
		
				let final: Record<string, any> = {};
				if (gxsk.length > 0) {
					for (let i in gxsk) {
						if (gxsk[i] in final) {
							final[gxsk[i]] = Array.from(new Set(final[gxsk[i]].concat(gxsv[i])));
						} else {
							final[gxsk[i]] = gxsv[i];
						}
					}
				}
			
				// for json format
				// writeFileSync('src/assets/citizens-super-secret-info.txt', JSON.stringify(final, null, "\t"), { flag: 'w' });

				// for cleaner print
				let cleanPrint = '';
				for (let galaxyName in final) {
					let actors = final[galaxyName].map((actor: any) => ` - ${actor}`);
					cleanPrint += galaxyName + '\n' + actors.join('\n') + '\n\n';
				}
				writeFileSync('src/assets/citizens-super-secret-info.txt', cleanPrint, { flag: 'w' });
			}
		}).catch((err) => console.log('err', err));
	}
}, 500)
// processing requestss every 500ms to avoid error: To Many requests from Cloludfront