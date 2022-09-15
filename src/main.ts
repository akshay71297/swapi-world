import { Character } from "./model/interface";
import { readFileSync } from 'fs';
import axios from 'axios';
import array from 'lodash';

const secretData = readFileSync('src/assets/super-secret-data.txt', 'utf-8');
const secretDataArray = [secretData.split('\n')[0]];

const ary = array.chunk(secretDataArray, secretDataArray.length/10000)
console.log(ary.length)

axios.all(secretDataArray.map((body) => axios.post('https://txje3ik1cb.execute-api.us-east-1.amazonaws.com/prod/decrypt',
body, {
	headers:  {
		'Content-Type': 'application/json',
		'x-api-key': 'Q76n6BBoa46yWuxYL7By02KcKfOQz0kd9lVflIXZ'
	},
	maxContentLength: Infinity,
	maxBodyLength: Infinity
}
))).then(
	(data) => console.log(data),
  );
