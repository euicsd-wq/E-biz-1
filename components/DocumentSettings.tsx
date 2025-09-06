import React from 'react';
import type { useTenderStore } from '../hooks/useTenderStore';
import type { DocumentSettings } from '../types';
import { DocumentTemplateStyle } from '../types';
import DocumentPreview from './DocumentPreview';

type DocumentSettingsProps = {
  store: ReturnType<typeof useTenderStore>;
};

const TEMPLATE_PRESETS: Record<DocumentTemplateStyle, Partial<DocumentSettings>> = {
    [DocumentTemplateStyle.CLASSIC]: {
      fontFamily: 'Times New Roman',
      fontSize: 11,
      logoPosition: 'left',
      tableTheme: 'grid',
      accentColor: '#333333',
      secondaryColor: '#dddddd',
      textColor: '#000000',
    },
    [DocumentTemplateStyle.MODERN]: {
      fontFamily: 'Inter',
      fontSize: 10,
      logoPosition: 'left',
      tableTheme: 'striped',
      accentColor: '#000000',
      secondaryColor: '#f3f4f6',
      textColor: '#111827',
    },
    [DocumentTemplateStyle.MINIMALIST]: {
      fontFamily: 'Inter',
      fontSize: 9,
      logoPosition: 'right',
      tableTheme: 'plain',
      accentColor: '#555555',
      secondaryColor: '#eeeeee',
      textColor: '#333333',
    },
};

const Section: React.FC<{ title: string, children: React.ReactNode }> = ({ title, children }) => (
    <details className="bg-slate-900/50 rounded-lg" open>
        <summary className="px-4 py-3 font-semibold text-white cursor-pointer hover:bg-slate-800/50 rounded-t-lg">{title}</summary>
        <div className="p-4 border-t border-slate-700 space-y-4">{children}</div>
    </details>
);


const DocumentSettings: React.FC<DocumentSettingsProps> = ({ store }) => {
  const { documentSettings, updateDocumentSettings, companyProfile } = store;

  const handleSettingChange = (field: keyof DocumentSettings, value: any) => {
    updateDocumentSettings({ [field]: value });
  };

  const handleTemplateChange = (style: DocumentTemplateStyle) => {
    const preset = TEMPLATE_PRESETS[style];
    updateDocumentSettings({
        ...documentSettings,
        ...preset,
        templateStyle: style,
    });
  };

  return (
    <div className="bg-slate-800/80 p-6 rounded-lg border border-slate-700">
        <h2 className="text-xl font-semibold text-white">Document Appearance</h2>
        <p className="text-sm text-slate-400 mb-6">Customize the appearance of your generated documents like Quotes and Technical Offers.</p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column: Controls */}
            <div className="space-y-6">
                <Section title="Style Presets">
                    <p className="text-sm text-slate-400 mb-4">Choose a preset style to quickly update all options.</p>
                     <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {Object.values(DocumentTemplateStyle).map(style => (
                            <div key={style}>
                                <label className={`block p-2 border-2 rounded-lg cursor-pointer ${documentSettings.templateStyle === style ? 'border-blue-500 bg-blue-500/10' : 'border-slate-600 bg-slate-700/50 hover:border-slate-500'}`} onClick={() => handleTemplateChange(style)}>
                                    <input type="radio" name="templateStyle" value={style} checked={documentSettings.templateStyle === style} onChange={() => {}} className="sr-only" />
                                    <p className="text-center text-sm font-medium text-slate-200 mt-1">{style}</p>
                                </label>
                            </div>
                        ))}
                    </div>
                </Section>
                 <Section title="Layout & Spacing">
                     <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Page Margins</label>
                        <select id="pageMargin" value={documentSettings.pageMargin} onChange={e => handleSettingChange('pageMargin', e.target.value)} className="input-style">
                            <option value="small">Small</option>
                            <option value="medium">Medium</option>
                            <option value="large">Large</option>
                        </select>
                    </div>
                    <label htmlFor="showLogo" className="flex items-center cursor-pointer pt-2">
                        <div className="relative">
                            <input type="checkbox" id="showLogo" className="sr-only" checked={documentSettings.showLogo} onChange={e => handleSettingChange('showLogo', e.target.checked)} />
                            <div className={`block w-12 h-6 rounded-full transition-colors ${documentSettings.showLogo ? 'bg-blue-600' : 'bg-slate-600'}`}></div>
                            <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${documentSettings.showLogo ? 'transform translate-x-6' : ''}`}></div>
                        </div>
                        <span className="ml-3 text-sm font-medium text-slate-300">Show Company Logo</span>
                    </label>
                     <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Logo Position</label>
                        <select id="logoPosition" value={documentSettings.logoPosition} onChange={e => handleSettingChange('logoPosition', e.target.value)} className="input-style"><option value="left">Left</option><option value="right">Right</option></select>
                     </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Logo Size</label>
                        <select id="logoSize" value={documentSettings.logoSize} onChange={e => handleSettingChange('logoSize', e.target.value)} className="input-style"><option value="small">Small</option><option value="medium">Medium</option><option value="large">Large</option></select>
                     </div>
                </Section>
                <Section title="Colors">
                     <div>
                        <label htmlFor="accentColor" className="block text-sm font-medium text-slate-300 mb-1">Primary Color (Headers)</label>
                        <div className="flex items-center gap-2"><input id="accentColor" type="color" value={documentSettings.accentColor} onChange={e => handleSettingChange('accentColor', e.target.value)} className="p-1 h-10 w-10 block bg-slate-700 border-slate-600 cursor-pointer rounded-lg"/><input type="text" value={documentSettings.accentColor} onChange={e => handleSettingChange('accentColor', e.target.value)} className="input-style"/></div>
                    </div>
                     <div>
                        <label htmlFor="secondaryColor" className="block text-sm font-medium text-slate-300 mb-1">Secondary Color (Borders, Stripes)</label>
                        <div className="flex items-center gap-2"><input id="secondaryColor" type="color" value={documentSettings.secondaryColor} onChange={e => handleSettingChange('secondaryColor', e.target.value)} className="p-1 h-10 w-10 block bg-slate-700 border-slate-600 cursor-pointer rounded-lg"/><input type="text" value={documentSettings.secondaryColor} onChange={e => handleSettingChange('secondaryColor', e.target.value)} className="input-style"/></div>
                    </div>
                     <div>
                        <label htmlFor="textColor" className="block text-sm font-medium text-slate-300 mb-1">Text Color</label>
                        <div className="flex items-center gap-2"><input id="textColor" type="color" value={documentSettings.textColor} onChange={e => handleSettingChange('textColor', e.target.value)} className="p-1 h-10 w-10 block bg-slate-700 border-slate-600 cursor-pointer rounded-lg"/><input type="text" value={documentSettings.textColor} onChange={e => handleSettingChange('textColor', e.target.value)} className="input-style"/></div>
                    </div>
                </Section>
                 <Section title="Typography & Content">
                     <div>
                        <label htmlFor="fontFamily" className="block text-sm font-medium text-slate-300 mb-1">Font Family</label>
                        <select id="fontFamily" value={documentSettings.fontFamily} onChange={e => handleSettingChange('fontFamily', e.target.value)} className="input-style"><option value="Inter">Sans-Serif (Inter)</option><option value="Times New Roman">Serif (Times New Roman)</option><option value="Courier New">Monospace (Courier New)</option></select>
                    </div>
                     <div>
                        <label htmlFor="fontSize" className="block text-sm font-medium text-slate-300 mb-1">Base Font Size (pt)</label>
                        <input id="fontSize" type="number" value={documentSettings.fontSize} onChange={e => handleSettingChange('fontSize', parseInt(e.target.value, 10))} className="input-style" min="8" max="14"/>
                    </div>
                     <div>
                        <label htmlFor="footerText" className="block text-sm font-medium text-slate-300 mb-1">Custom Footer Text</label>
                        <textarea id="footerText" value={documentSettings.footerText} onChange={e => handleSettingChange('footerText', e.target.value)} className="input-style min-h-[80px]" />
                    </div>
                </Section>
            </div>
            {/* Right Column: Preview */}
            <div className="relative h-full min-h-[500px]">
                 <div className="lg:sticky top-8 transform scale-[0.8] lg:scale-100 origin-top">
                     <DocumentPreview settings={documentSettings} companyProfile={companyProfile} />
                </div>
            </div>
        </div>
    </div>
  );
};

export default DocumentSettings;