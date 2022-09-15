import { readFileSync, writeFileSync } from 'fs';
import axios, {AxiosResponse} from 'axios';
import array, { ceil } from 'lodash';
import { _setInterval } from './util/utils';

let batchNumber = 0;
let batchSize = 1000;

const secretData = readFileSync('src/assets/super-secret-data.txt', 'utf-8');
const secretDataArray = secretData.split('\n');

const ary = (array.chunk(secretDataArray, ceil(batchSize))).slice(0, 3);  // 101 chunks with aprox. 1000 elements in array

let requestPromises: Promise<AxiosResponse<any, any>>[] = [];
console.log(ary.length);

const intervalID = setInterval(() => {

	let min = batchNumber * 1;
	let max = (batchNumber+1) * 1;
	batchNumber++
	

	ary.slice(min, max).map((elements) => {
		console.log('here');
		let body = elements.map((el) => el.replace(/(\r\n|\n|\r)/gm, '')); // cleaning 
		requestPromises.push(
			axios.post('https://txje3ik1cb.execute-api.us-east-1.amazonaws.com/prod/decrypt', body, {
				headers: {
				'Content-Type': 'application/json',
				'x-api-key': 'Q76n6BBoa46yWuxYL7By02KcKfOQz0kd9lVflIXZ',
				},
				maxContentLength: Infinity,
				maxBodyLength: Infinity})
			);
	})
	console.log(min, max);

	if(max >= ary.length) {
		clearInterval(intervalID);
		Promise.all(requestPromises).then((responses) => {
			if (responses.length > 0) {
			  writeFileSync('src/example.txt', '', { flag: 'w' });
			  let gxsk: Record<string, any> = [];
			  let gxsv: Record<string, any> = [];
			  responses.forEach((response) => {
				let resp: Array<any> = response.data; // response.data array of stringed objs
				let actors = resp.map((actor) => {
				  return JSON.parse(actor);
				});
				let homeworlds = actors.reduce(function (cb, initial) {
				  cb[initial.homeworld] = cb[initial.homeworld] || [];
				  cb[initial.homeworld].push(initial.name);
				  return cb;
				}, {});
				
				for (let homeworld in homeworlds) {
					gxsk.push(homeworld);
					gxsv.push(homeworlds[homeworld]);
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
		
			  console.log(final)
			  writeFileSync('src/example.txt', JSON.stringify(final, null, "\t"), { flag: 'w' });
			}
		  })
		  .catch((err) => console.log('err', err));
	}
}, 1000)


  