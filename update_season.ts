import * as fs from 'fs';

function updateFile(filePath: string) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Replace { \n "name": with { \n "season": "S1", \n "name":
  // and { "name": with { "season": "S1", "name":
  content = content.replace(/\{\s*"name":/g, '{\n    "season": "S1",\n    "name":');
  
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Updated ${filePath}`);
}

updateFile('lib/wujiang_data.ts');
updateFile('lib/zhanfa_data.ts');
