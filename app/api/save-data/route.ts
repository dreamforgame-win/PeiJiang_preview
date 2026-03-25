import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: Request) {
  try {
    const { type, data } = await request.json();

    if (!type || !data) {
      return NextResponse.json({ error: 'Missing type or data' }, { status: 400 });
    }

    let filePath = '';
    let variableName = '';

    if (type === 'general') {
      filePath = path.join(process.cwd(), 'lib', 'wujiang_data.ts');
      variableName = 'wujiangData';
    } else if (type === 'tactic') {
      filePath = path.join(process.cwd(), 'lib', 'zhanfa_data.ts');
      variableName = 'zhanfaData';
    } else {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    const fileContent = fs.readFileSync(filePath, 'utf-8');
    
    // Find the last "];" in the file
    const lastBracketIndex = fileContent.lastIndexOf('];');
    if (lastBracketIndex === -1) {
      return NextResponse.json({ error: 'Could not parse data file' }, { status: 500 });
    }

    // Format the new data as a JSON string
    const newDataString = JSON.stringify(data, null, 2);
    
    // Check if the array is empty (ends with "=[ \n]*];")
    const isArrayEmpty = fileContent.substring(0, lastBracketIndex).trim().endsWith('[');
    
    // Construct the new file content
    const beforeBracket = fileContent.substring(0, lastBracketIndex).trimEnd();
    // If it ends with a comma, we don't need to add one. Otherwise, add a comma unless the array is empty.
    const needsComma = !beforeBracket.endsWith(',') && !isArrayEmpty;
    
    const newFileContent = 
      beforeBracket + 
      (needsComma ? ',\n  ' : '\n  ') + 
      newDataString.replace(/\n/g, '\n  ') + 
      ',\n];\n';

    fs.writeFileSync(filePath, newFileContent, 'utf-8');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
