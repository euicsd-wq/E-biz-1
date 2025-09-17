import React, { useState } from 'react';
import type { useTenderStore } from '../../hooks/useTenderStore';
import type { WatchlistItem, Shipment } from '../../types';
import { TenderStatus, DocumentType, DocumentCategory } from '../../types';
import { PlusIcon, TrashIcon, EditIcon, LinkIcon, DocumentDownloadIcon } from '../icons';
import ShipmentModal from '../ShipmentModal';
import { formatTenderDate } from '../../utils';
import { generatePdf } from '../../services/pdfService';

type LogisticsSectionProps = { 
    tender: WatchlistItem; 
    store: ReturnType<typeof useTenderStore>
};

const LogisticsSection: React.FC<LogisticsSectionProps> = ({ tender, store }) => {
    const { shipments, vendors, removeShipment, addDocument, companyProfile, clients, documentSettings } = store;
    const [isShipmentModalOpen, setIsShipmentModalOpen] = useState(false);
    const [editingShipment, setEditingShipment] = useState<Shipment | null>(null);

    const tenderShipments = shipments.filter(s => s.tenderId === tender.tender.id);
    const vendorMap = vendors.reduce((acc, v) => ({...acc, [v.id]: v.name}), {} as Record<string, string>);
    
    if (tender.status !== TenderStatus.WON) {
        return <p className="text-center text-slate-400 py-8">Logistics can be managed after the tender is marked as 'Won'.</p>
    }

    const handlePrintDeliveryNote = async () => {
        try {
            const docToSave = await generatePdf(DocumentType.DELIVERY_NOTE, tender, companyProfile, clients, documentSettings);
            if (docToSave) {
                 addDocument(tender.id, docToSave, DocumentCategory.GENERATED, 'System', true);
                 store.addToast(`${docToSave.name} generated and saved to Documents.`, 'success');
            }
        } catch (error) {
            console.error("Delivery Note PDF generation failed", error);
            store.addToast(`Failed to generate Delivery Note PDF: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-white">Shipments</h2>
                <div className="flex gap-2">
                    <button onClick={handlePrintDeliveryNote} className="btn-secondary text-sm">Print Delivery Note</button>
                    <button onClick={() => { setEditingShipment(null); setIsShipmentModalOpen(true); }} className="btn-primary text-sm"><PlusIcon className="w-4 h-4 mr-2"/>Add Shipment</button>
                </div>
            </div>

            {tenderShipments.length > 0 ? (
                 <div className="space-y-4">
                    {tenderShipments.map(shipment => (
                        <div key={shipment.id} className="bg-slate-900/50 rounded-lg border border-slate-700 p-4 flex flex-col sm:flex-row justify-between items-start gap-4">
                             <div>
                                <div className="flex items-center gap-2">
                                    <p className="font-bold text-white">{shipment.awbNumber}</p>
                                    {shipment.trackingLink && <a href={shipment.trackingLink} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300"><LinkIcon className="w-4 h-4"/></a>}
                                </div>
                                <p className="text-sm text-slate-400">{vendorMap[shipment.vendorId] || 'N/A'}</p>
                                <p className="text-xs text-slate-500 mt-1">Delivery due: {formatTenderDate(shipment.deliveryDate)}</p>
                            </div>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-4 w-full sm:w-auto">
                                <div className="flex flex-col sm:text-right">
                                    <span className={`px-2 py-0.5 text-xs font-semibold rounded-full self-start sm:self-end bg-slate-600/50 text-slate-300`}>
                                        {shipment.status}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1">
                                    {shipment.awbDocument && <a href={shipment.awbDocument.data} download={shipment.awbDocument.name} className="btn-icon" title="Download AWB"><DocumentDownloadIcon className="w-5 h-5"/></a>}
                                    {shipment.podDocument && <a href={shipment.podDocument.data} download={shipment.podDocument.name} className="btn-icon" title="Download POD"><DocumentDownloadIcon className="w-5 h-5"/></a>}
                                    <button onClick={() => { setEditingShipment(shipment); setIsShipmentModalOpen(true); }} className="btn-icon" title="Edit Shipment"><EditIcon className="w-5 h-5"/></button>
                                    <button onClick={() => removeShipment(shipment.id)} className="btn-icon-danger" title="Delete Shipment"><TrashIcon className="w-5 h-5"/></button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-center text-slate-400 py-8">No shipments logged for this tender yet.</p>
            )}

            <ShipmentModal isOpen={isShipmentModalOpen} onClose={() => setIsShipmentModalOpen(false)} store={store} shipmentToEdit={editingShipment} preselectedTenderId={tender.id} />
        </div>
    );
};

export default LogisticsSection;