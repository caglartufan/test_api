function fstat(file, callback) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            if(file == 0) resolve(20);
            else if(file == 1) resolve(40);
            else resolve(60);
        }, 1500);
    });
}

let files = [0, 1, 2];
let total = 0;
let promises = [];

for(let file in files) {
    promises.push(fstat(file));
}

Promise.all(promises)
    .then((vals) => {
        vals.forEach(size => total += size);
        console.log(total);
    });

console.log(total);