import vscode from 'vscode';
import * as path from 'path';
import fs from 'fs';
import puppeteer from 'puppeteer-core';

export default async function spitOutThatCode() {
    let message = "hello Karan";

    if(vscode.workspace.workspaceFolders !== undefined) {
        message = `This folder looks good, let me dive in it ✨` ;
        vscode.window.showInformationMessage(message);
        vscode.window.showInformationMessage("Your code is being digested 🤤");

        // let's get all the files except files which are mentioned in gitignore and binaries images
        const gitignoreFiles = await vscode.workspace.findFiles('.gitignore');
        
        let gitignorePatterns: string[] = [];
        
        if (gitignoreFiles.length > 0) {
            const gitignoreContent = await vscode.workspace.fs.readFile(gitignoreFiles[0]);
            gitignorePatterns = gitignoreContent.toString().split('\n').filter(line => !line.startsWith('#') && line.trim() !== '');
        }
        
        // binary files are not good
        const binaryFileExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.ico', '.webp', '.svg', '.tif', '.tiff', '.pdf'];

        const excludePatterns = [...gitignorePatterns, ...binaryFileExtensions.map(ext => `**/*${ext}`,"!**/node_modules/**")];
        
        // need to write the content in a single file in pdf format
        const textFile = path.join(vscode.workspace.workspaceFolders[0].uri.fsPath, 'code.txt');
        vscode.workspace.findFiles('**/*', excludePatterns.join(',')).then(async(files) => {
            // console.log(files);
            // reading all the files,if any file gives error then we will skip that file
            // doc.pipe(fs.createWriteStream('KaranisSexy.pdf'));
            const contents = files.map(file => {
                try {
                   return fs.readFileSync(file.fsPath, 'utf-8')
                } catch (error) {
                    vscode.window.showErrorMessage(`This file is not good for my stomach skipping it: ${file.fsPath}`);
                    return '';
                }
            });
            
            
            // console.log(contents);
            
            await exportPdf(contents);

            vscode.window.showInformationMessage("Your Beautiful Pdf is ready 🥰");

        }
        )
        

    } 
    else {
        message = "How will i know where you are? 🤡" ;
    
        vscode.window.showErrorMessage(message);
    }
    
}



function  exportPdf(data:string[]){

    return vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: "Exporting PDF",
    }, async (progress, token) => {
        const browser = await puppeteer.launch({
            executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
            //  vscode.workspace.getConfiguration('codeSpitter')['executablePath'] ||
            //   puppeteer.executablePath(),
            headless: false,
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
        });
        const page = await browser.newPage();
        console.log("this is data======================");
        console.log("code",data);
        await page.setContent(`<h1>Karan</h1>`);

        await page.pdf({
            path: 'karanisSexy.pdf',
            format: 'A4',
            printBackground: true,
        });
        await browser.close();
    })       

}


// const uri = vscode.Uri.joinPath(vscode.workspace.workspaceFolders![0].uri, 'karanisSexy.pdf');

//         vscode.workspace.findFiles('**/*', `{${excludePatterns.join(',')}}`).then((files) => {
//             const contents = files.map(file => fs.readFileSync(file.fsPath, 'utf-8'));
//             console.log("this is content",contents);
//             // writing the content in single file
//             // also need to add file name and file path in the content
//             vscode.workspace.fs.writeFile(uri, Buffer.from(contents.join(' ')));

//         });
