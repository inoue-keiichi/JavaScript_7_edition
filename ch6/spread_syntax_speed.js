const calcurate = (a,callback)=>{
  const start = performance.now();
  const result = callback(a);
  const end = performance.now();
  console.log(`result: ${end-start}[ms]`);
  return result;
}

const copy = (x)=>{
  const y = {...x}
  return y;
}

const MAX = 10000;


const start = performance.now();
const x = {};
for(let i=0;i<MAX;i++){
 x[i]=1;
}

const xx = {};
for(let i=0;i<MAX;i++){
 const x={}
 for(let j=0;j<MAX;j++){
  x[j]=1;
 }
 xx[i]=x;
}

const end = performance.now();
console.log(`result: ${end-start}[ms]`);

console.log("x");
const y = calcurate(x,copy);

console.log("xx");
const yy = calcurate(xx,copy);

