const coils = 15;
const width = 30;
const startY = 0;
const endY = 100;
const deltaY = (endY - startY) / (coils * 2);
let pathStr = `M 0 ${startY}`;
for (let i = 0; i < coils; i++) {
    pathStr += ` L ${width/2} ${startY + deltaY * (2*i + 0.5)}`;
    pathStr += ` L ${-width/2} ${startY + deltaY * (2*i + 1.5)}`;
}
pathStr += ` L 0 ${endY}`;
console.log(pathStr);
