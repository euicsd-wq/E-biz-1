import { WatchlistItem, CompanyProfile, DocumentSettings, Client, PurchaseOrder, Vendor, DocumentType, QuoteItem } from '../types';
import { getContrastingTextColor, formatCurrency } from '../utils';
import { DEFAULT_TECH_SPEC_FIELDS, DEFAULT_SERVICE_SPEC_FIELDS } from '../constants';

declare global {
    interface Window {
        jspdf: any;
    }
}

const FONT_MAP = {
    'Inter': 'helvetica',
    'Roboto': 'helvetica', // Using helvetica as a fallback for Roboto
    'Times New Roman': 'times',
    'Courier New': 'courier',
};

// FIX: Add mappings for string-based settings to numeric values for PDF generation.
const logoSizeMap: Record<'small' | 'medium' | 'large', number> = { small: 20, medium: 25, large: 30 };
const pageMarginMap: Record<'small' | 'medium' | 'large', number> = { small: 10, medium: 15, large: 20 };


// Helper to add header to each page
const addHeaderAndFooter = (doc: any, settings: DocumentSettings, companyProfile: CompanyProfile, title: string, pageNumber: number, totalPages: number) => {
    const pageMargin = pageMarginMap[settings.pageMargin];
    const logoSize = logoSizeMap[settings.logoSize];

    // Header
    if (settings.showLogo && companyProfile.logo) {
        try {
            const imgProps = doc.getImageProperties(companyProfile.logo);
            const logoWidth = logoSize;
            const logoHeight = (imgProps.height * logoWidth) / imgProps.width;
            doc.addImage(companyProfile.logo, 'PNG', pageMargin, pageMargin, logoWidth, logoHeight);
        } catch (e) { console.error("Error adding logo to PDF:", e); }
    }
    
    doc.setFontSize(16);
    doc.setFont(FONT_MAP[settings.fontFamily], 'bold');
    doc.setTextColor(settings.accentColor);
    doc.text(title, doc.internal.pageSize.getWidth() - pageMargin, pageMargin + 10, { align: 'right' });

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(150);
    const footerY = doc.internal.pageSize.getHeight() - 10;
    doc.text(`Page ${pageNumber} of ${totalPages}`, doc.internal.pageSize.getWidth() - pageMargin, footerY, { align: 'right' });
    doc.text(companyProfile.name, pageMargin, footerY, { align: 'left' });
};

export const generatePdf = async (
    type: DocumentType,
    tender: WatchlistItem,
    companyProfile: CompanyProfile,
    clients: Client[],
    settings: DocumentSettings,
    po?: PurchaseOrder,
    vendors?: Vendor[]
): Promise<{ name: string; type: string; data: string }> => {
    
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
    
    const client = clients.find(c => c.id === tender.financialDetails?.clientId);
    const vendor = po ? vendors?.find(v => v.id === po.vendorId) : undefined;

    const pageMargin = pageMarginMap[settings.pageMargin];
    const logoSize = logoSizeMap[settings.logoSize];

    let docName = 'document.pdf';
    let docTitle = '';
    let tableHead: any[] = [];
    let tableBody: any[] = [];
    let totals: { label: string; value: number }[] = [];
    
    const commonMeta = (idLabel: string, id: string | undefined) => ({
        [idLabel]: id || 'N/A',
        'Date': new Date().toLocaleDateString(),
        'Project Ref': tender.tender.title,
    });
    
    switch (type) {
        case DocumentType.QUOTE:
        case DocumentType.PROFORMA_INVOICE:
            docTitle = type === DocumentType.QUOTE ? settings.documentTitleQuote : settings.documentTitleProforma;
            docName = `${docTitle.replace(' ', '-')}-${tender.tender.title.slice(0, 15)}.pdf`;
            tableHead = [['#', 'Item Description', 'Qty', 'Unit Price', 'Total']];
            tableBody = (tender.quoteItems || []).map((item, i) => [
                i + 1,
                `${item.itemName}\n${item.description}`,
                item.quantity,
                formatCurrency(item.unitPrice),
                formatCurrency(item.unitPrice * item.quantity)
            ]);
            const subtotal = (tender.quoteItems || []).reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
            const delivery = tender.financialDetails?.deliveryCost || 0;
            const vat = subtotal * ((tender.financialDetails?.vatPercentage || 0) / 100);
            totals = [
                { label: 'Subtotal', value: subtotal },
                { label: 'Delivery', value: delivery },
                { label: `VAT (${tender.financialDetails?.vatPercentage || 0}%)`, value: vat },
                { label: 'Total', value: subtotal + delivery + vat },
            ];
            break;
        case DocumentType.COMMERCIAL_INVOICE:
            // Assuming the first invoice is the one to print for simplicity
            const invoice = tender.invoices?.[0];
            if (!invoice) throw new Error("No invoice available to generate.");
            docTitle = settings.documentTitleInvoice;
            docName = `Invoice-${invoice.invoiceNumber}.pdf`;
            tableHead = [['Description', 'Amount']];
            tableBody = [[invoice.description, formatCurrency(invoice.amount)]];
            totals = [{ label: 'Total Due', value: invoice.amount }];
            break;
        case DocumentType.PURCHASE_ORDER:
            if (!po) throw new Error("Purchase Order data not provided.");
            docTitle = settings.documentTitlePO;
            docName = `PO-${po.poNumber}.pdf`;
            tableHead = [['#', 'Item Description', 'Qty', 'Unit Price', 'Total']];
            tableBody = po.items.map((item, i) => [i + 1, item.description, item.quantity, formatCurrency(item.unitPrice), formatCurrency(item.unitPrice * item.quantity)]);
            const poTotal = po.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
            totals = [{ label: 'Total', value: poTotal }];
            break;
        case DocumentType.DELIVERY_NOTE:
            docTitle = settings.documentTitleDeliveryNote;
            docName = `Delivery-Note-${tender.tender.title.slice(0, 15)}.pdf`;
            tableHead = [['#', 'Item Description', 'Quantity Shipped']];
            tableBody = (tender.quoteItems || []).map((item, i) => [i + 1, item.itemName, item.quantity]);
            break;
        // Technical Offer is special, no table here
        case DocumentType.TECHNICAL_OFFER:
            docTitle = 'Technical Offer';
            docName = `Technical-Offer-${tender.tender.title.slice(0, 15)}.pdf`;
            break;
    }

    let lastY = 0;
    
    doc.autoTable({
        didDrawPage: (data: any) => {
            addHeaderAndFooter(doc, settings, companyProfile, docTitle, data.pageNumber, data.pageNumber);
            
            // Client/Vendor Info
            let yPos = pageMargin + (settings.showLogo ? logoSize : 0) + 15;
            doc.setFontSize(settings.fontSize);
            doc.setTextColor(80);

            if (client) {
                doc.setFont(FONT_MAP[settings.fontFamily], 'bold');
                doc.text('Bill To:', pageMargin, yPos);
                doc.setFont(FONT_MAP[settings.fontFamily], 'normal');
                doc.text(`${client.name}\n${client.address}`, pageMargin, yPos + 5);
            }
             if (vendor) {
                doc.setFont(FONT_MAP[settings.fontFamily], 'bold');
                doc.text('Vendor:', pageMargin, yPos);
                doc.setFont(FONT_MAP[settings.fontFamily], 'normal');
                doc.text(`${vendor.name}\n${vendor.address}`, pageMargin, yPos + 5);
            }
            
            const meta = commonMeta(
                type === DocumentType.PURCHASE_ORDER ? 'PO #' : 'Quote #',
                type === DocumentType.PURCHASE_ORDER ? po?.poNumber : tender.financialDetails?.quoteNumber
            );

            let metaX = doc.internal.pageSize.getWidth() - pageMargin;
            Object.entries(meta).forEach(([key, value]) => {
                doc.setFont(FONT_MAP[settings.fontFamily], 'bold');
                doc.text(key, metaX, yPos, { align: 'right' });
                doc.setFont(FONT_MAP[settings.fontFamily], 'normal');
                doc.text(value, metaX - 30, yPos);
                yPos += 5;
            });
            
            lastY = yPos + 10;
        },
        margin: { top: pageMargin + (settings.showLogo ? logoSize : 0) + 40, bottom: 20 },
    });

    if (type === DocumentType.TECHNICAL_OFFER) {
        (tender.quoteItems || []).forEach((item: QuoteItem, index: number) => {
            const specFields = item.itemType === 'Services' ? DEFAULT_SERVICE_SPEC_FIELDS : DEFAULT_TECH_SPEC_FIELDS;
            const specs = specFields
                .filter(field => item.technicalDetails?.[field.id])
                .map(field => [field.label, item.technicalDetails?.[field.id] || '']);
            
            doc.setFontSize(settings.fontSize + 2);
            doc.setFont(FONT_MAP[settings.fontFamily], 'bold');
            doc.setTextColor(settings.accentColor);
            doc.text(`Item ${index + 1}: ${item.itemName}`, pageMargin, lastY);
            lastY += 7;

            doc.autoTable({
                startY: lastY,
                body: specs,
                theme: 'grid',
                styles: { fontSize: settings.fontSize - 1, font: FONT_MAP[settings.fontFamily] },
                columnStyles: { 0: { fontStyle: 'bold', cellWidth: 60 } },
            });
            lastY = doc.autoTable.previous.finalY + 10;
        });

    } else {
         doc.autoTable({
            startY: lastY,
            head: [tableHead],
            body: tableBody,
            theme: 'striped',
            headStyles: { fillColor: settings.accentColor, textColor: getContrastingTextColor(settings.accentColor), font: FONT_MAP[settings.fontFamily], fontSize: settings.fontSize },
            styles: { fontSize: settings.fontSize - 1, font: FONT_MAP[settings.fontFamily], cellPadding: 2 },
            didDrawPage: (data: any) => {
                 // Re-draw header/footer on new pages
                 if (data.pageNumber > 1) {
                    addHeaderAndFooter(doc, settings, companyProfile, docTitle, data.pageNumber, data.pageNumber);
                 }
            }
        });
        lastY = doc.autoTable.previous.finalY;
    }


    // Totals Section
    if (totals.length > 0) {
        lastY += 10;
        const totalX = doc.internal.pageSize.getWidth() - pageMargin;
        doc.setFontSize(settings.fontSize);
        totals.forEach((t, i) => {
            if (i === totals.length - 1) { // Final total
                doc.setFont(FONT_MAP[settings.fontFamily], 'bold');
                doc.setFillColor(settings.accentColor);
                doc.rect(totalX - 60, lastY - 5, 60, 7, 'F');
                doc.setTextColor(getContrastingTextColor(settings.accentColor));
            }
            doc.text(t.label, totalX - 58, lastY);
            doc.text(formatCurrency(t.value), totalX, lastY, { align: 'right' });
            lastY += 7;
            doc.setTextColor(80);
            doc.setFont(FONT_MAP[settings.fontFamily], 'normal');
        });
    }

    // Terms & Notes
    const terms = tender.financialDetails?.termsAndConditions || '';
    if (terms) {
        lastY += 10;
        doc.setFontSize(settings.fontSize);
        doc.setTextColor(80);
        doc.text(settings.termsLabel, pageMargin, lastY);
        doc.setFontSize(settings.fontSize - 2);
        const termsLines = doc.splitTextToSize(terms, doc.internal.pageSize.getWidth() - pageMargin * 2);
        doc.text(termsLines, pageMargin, lastY + 5);
    }
    
    // Finalize footer with correct page count
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        if (settings.showPageNumbers) {
            doc.setFontSize(8);
            doc.setTextColor(150);
            doc.text(`Page ${i} of ${totalPages}`, doc.internal.pageSize.getWidth() - pageMargin, doc.internal.pageSize.getHeight() - 10, { align: 'right' });
        }
    }


    doc.save(docName);

    return {
        name: docName,
        type: 'application/pdf',
        data: doc.output('datauristring')
    };
};