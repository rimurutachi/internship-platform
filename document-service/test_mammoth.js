const mammoth = require("mammoth");

function transformRun(run) {
  if (run.color) {
      console.log("Found color:", run.color);
  }
  return run;
}

const options = {
  transformDocument: mammoth.transforms.run(transformRun)
};

console.log("Mammoth loaded!");
