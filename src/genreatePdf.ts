import * as fs from 'fs';
import * as path from 'path';
import puppeteer from 'puppeteer-core';
import * as vscode from 'vscode';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

export async function generatePdf(contents: string[]) {
  // First, we split the contents into smaller chunks
  const chunkSize = 1000; // You can adjust this value based on your needs
  const chunks = [];
  for (let i = 0; i < contents.length; i += chunkSize) {
    chunks.push(contents.slice(i, i + chunkSize));
  }

    // Prompt user for operating system
    const osOptions = ['Windows', 'Mac', 'Linux'];
    const osSelection = await vscode.window.showQuickPick(osOptions, { placeHolder: 'Select your operating system' });
  
    // Choose Puppeteer path based on operating system
    let puppeteerPath;
    switch (osSelection) {
      case 'Windows':
        puppeteerPath = 'C:/Program Files (x86)/Google/Chrome/Application';
        break;
      case 'Mac':
        puppeteerPath = '/Applications/Google Chrome.app/Contents/MacOS';
        break;
      case 'Linux':
        puppeteerPath = '/usr/bin';
        break;
      default:
        vscode.window.showErrorMessage('Invalid operating system selected');
        return;
    }
  
  // Then, we launch a new browser instance
  const browser = await puppeteer.launch({
    executablePath:path.join(puppeteerPath, 'Google chrome'),
    //  vscode.workspace.getConfiguration('codeSpitter')['executablePath'] ||
    //   puppeteer.executablePath(),
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  // We iterate over each chunk and generate a PDF for it
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];

    // We create a new page
    const page = await browser.newPage();

    // We set the content of the page to be the joined contents of the current chunk
    await page.setContent(chunk.join(' '));

    // We generate the PDF with the given options
    const pdfBytes = await page.pdf({
      format: 'A4',
      printBackground: true,
    });

    // We save the PDF to a file
    // @ts-ignore
    const filePath = path.join(vscode.workspace.workspaceFolders[0].uri.fsPath, `code_${i}.pdf`);
    fs.writeFileSync(filePath, pdfBytes);

    // Load the PDF with pdf-lib
    const pdfDoc = await PDFDocument.load(pdfBytes);

    // Get the number of pages in the PDF
    const pages = pdfDoc.getPages();
    const pageCount = pages.length;

    // Add the file name to the top of each page
    for (let j = 0; j < pageCount; j++) {
      const page = pages[j];
      const { width, height } = page.getSize();
      const fileName = `code_${i}.pdf`;
      const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const fontSize = 30;
      const textWidth = helveticaFont.widthOfTextAtSize(fileName, fontSize);
      const textHeight = helveticaFont.heightAtSize(fontSize);
      const textX = width / 2 - textWidth / 2;
      const textY = height - textHeight - 10;
      page.drawText(fileName, {
        x: textX,
        y: textY,
        size: fontSize,
        font: helveticaFont,
        color: rgb(0, 0, 0),
      });
    }
  }

  // Finally, we close the browser instance
  await browser.close();

  vscode.window.showInformationMessage("Your Beautiful Pdf is ready 🥰");

  // If this is the last file, combine all pdfs
  if (chunks.length === contents.length) {
    // We will use pdf-lib to generate a PDF from the contents and save it to the directory
    const pdfFiles = await vscode.workspace.findFiles('**/*.pdf', null, 1000);
    const pdfContents = pdfFiles.map(file => fs.readFileSync(file.fsPath))
    const mergedPdf = await PDFDocument.create();
    for (const pdfContent of pdfContents) {
      const pdf = await PDFDocument.load(pdfContent);
      const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
      copiedPages.forEach((page) => {
        mergedPdf.addPage(page);
      });
    }
    const mergedPdfBytes = await mergedPdf.save();
    // @ts-ignore
    fs.writeFileSync(path.join(vscode.workspace.workspaceFolders[0].uri.fsPath, 'code.pdf'), mergedPdfBytes);
  }
}

