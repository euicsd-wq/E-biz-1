import React, { forwardRef } from 'react';
import type { WatchlistItem, CompanyProfile, Invoice, Client } from '../types';
import { EmpireUnitedLogo } from './icons';

type PrintableInvoiceProps = {
  tender: WatchlistItem;
  invoice: Invoice;
  companyProfile: CompanyProfile;
  clients: Client[];
};

const PrintableInvoice = forwardRef<HTMLDivElement, PrintableInvoiceProps>(({ tender, invoice, companyProfile, clients }, ref) => {
    const { financialDetails } = tender;
    const client = clients.find(c => c.id === financialDetails?.clientId);
    const billTo = client 
        ? [client.name, client.address, client.email, client.phone].filter(Boolean).join('\n')
        : 'No Client Assigned';

  return (
    <div ref={ref} style={{ width: '210mm', minHeight: '297mm', fontFamily: 'Inter, sans-serif' }} className="p-10 bg-white text-black text-xs flex flex-col font-sans">
        <header className="flex justify-between items-start pb-4 border-b-2 border-black">
             <div className="flex items-center">
                {companyProfile.logo ? (
                  <img src={companyProfile.logo} alt="Company Logo" className="h-20 w-20 object-contain mr-4" />
                ) : (
                  <EmpireUnitedLogo className="h-20 w-20 mr-4" />
                )}
                <div>
                    <h1 className="text-xl font-bold text-black">{companyProfile.name}</h1>
                    <p className="text-gray-600 text-[10px]">{companyProfile.address}</p>
                    <p className="text-gray-600 text-[10px]">Phone: {companyProfile.phone} | Email: {companyProfile.email}</p>
                    <p className="text-gray-600 text-[10px]">Reg No.: {companyProfile.regNo} | TIN: {companyProfile.tin} | UNGM: {companyProfile.ungm}</p>
                </div>
            </div>
            <div className="text-right">
                <h2 className="text-5xl font-bold text-black tracking-wider">INVOICE</h2>
            </div>
        </header>
        
        <section className="flex justify-between my-8">
            <div className="w-1/2 pr-8">
                <div className="border border-gray-300 p-2 rounded-md min-h-[60px]">
                    <p className="font-bold text-black text-[10px]">BILL TO:</p>
                    <p className="whitespace-pre-wrap text-xs text-black">{billTo}</p>
                </div>
            </div>
            <div className="w-2/5">
                <table className="w-full text-sm">
                    <tbody>
                        <tr className="bg-gray-100"><td className="font-bold p-2 text-gray-500">Invoice #</td><td className="p-2 text-right text-black">{invoice.invoiceNumber}</td></tr>
                        <tr><td className="font-bold p-2 text-gray-500">Issue Date</td><td className="p-2 text-right text-black">{new Date(invoice.issueDate + 'T00:00:00').toLocaleDateString()}</td></tr>
                        <tr className="bg-gray-100"><td className="font-bold p-2 text-gray-500">Due Date</td><td className="p-2 text-right text-black">{new Date(invoice.dueDate + 'T00:00:00').toLocaleDateString()}</td></tr>
                    </tbody>
                </table>
            </div>
        </section>

        <section className="flex-grow">
            <table className="w-full text-left text-sm">
                <thead className="bg-black text-white">
                    <tr>
                        <th className="p-2 font-semibold w-[80%]">Description</th>
                        <th className="p-2 font-semibold text-right w-[20%]">Amount</th>
                    </tr>
                </thead>
                <tbody>
                    <tr className="border-b border-gray-200">
                        <td className="p-2 text-black">{invoice.description}</td>
                        <td className="p-2 text-right font-medium text-black">${invoice.amount.toFixed(2)}</td>
                    </tr>
                    {Array.from({ length: 10 }).map((_, i) => (
                      <tr key={`empty-${i}`} className="border-b border-gray-200 h-10"><td colSpan={2}></td></tr>
                    ))}
                </tbody>
            </table>
        </section>

        <section className="mt-4 flex justify-between items-start">
            <div className="w-1/2 pr-8 pt-4">
                <h3 className="font-bold text-black text-base mb-2">Payment Method</h3>
                <div className="text-[10px] text-black space-y-1">
                    {financialDetails?.paymentMethod?.split('\n').map((line, i) => <p key={i}>{line}</p>)}
                </div>
            </div>
            <div className="w-2/5">
                <table className="w-full text-sm">
                    <tbody>
                        <tr className="bg-black text-white font-bold text-base"><td className="p-2">TOTAL</td><td className="p-2 text-right">${invoice.amount.toFixed(2)}</td></tr>
                    </tbody>
                </table>
            </div>
        </section>
        
        <footer className="mt-auto pt-4 border-t border-black text-center text-gray-500 text-[9px]">
             <p>{companyProfile.name} | {companyProfile.address} | {companyProfile.phone}</p>
             <p>Generated by Tenders Hub</p>
        </footer>
    </div>
  );
});

export default PrintableInvoice;