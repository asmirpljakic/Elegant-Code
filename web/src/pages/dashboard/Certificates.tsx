import { useRef, useState } from 'react';
import { useGetMyCertificatesQuery } from '../../store/apiSlice';
import { Award, Download, Loader2, BookOpen } from 'lucide-react';
import { format } from 'date-fns';
import { srLatn } from 'date-fns/locale';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export default function Certificates() {
  const { data: certificates = [], isLoading } = useGetMyCertificatesQuery();
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  
  // Ref map to store references to all certificate DOM nodes
  const certRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const handleDownloadPDF = async (cert: any) => {
    try {
      setDownloadingId(cert._id);
      const element = certRefs.current[cert._id];
      if (!element) return;

      // Ensure fonts are loaded and layout is stable
      await new Promise(resolve => setTimeout(resolve, 100));

      const canvas = await html2canvas(element, {
        scale: 2, // Higher resolution
        useCORS: true,
        logging: false,
        backgroundColor: '#0f172a' // slate-900
      });

      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      
      // A4 landscape dimensions in mm: 297 x 210
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      pdf.addImage(imgData, 'JPEG', 0, 0, 297, 210);
      
      const studentName = `${cert.studentId?.firstName || 'Ucenik'}_${cert.studentId?.lastName || ''}`.replace(/\s+/g, '_');
      pdf.save(`Sertifikat_${studentName}_${cert.courseName.replace(/\s+/g, '_')}.pdf`);
      
    } catch (error) {
      console.error('Error generating PDF', error);
      alert('Došlo je do greške pri preuzimanju sertifikata.');
    } finally {
      setDownloadingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (certificates.length === 0) {
    return (
      <div className="p-8 h-full flex flex-col">
        <h1 className="text-2xl font-bold text-white mb-8 flex items-center gap-2">
          <Award className="w-8 h-8 text-amber-400" />
          Moji Sertifikati
        </h1>
        <div className="flex-1 flex flex-col items-center justify-center text-center bg-slate-900/50 rounded-3xl border border-slate-800 p-8">
          <div className="w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center mb-6">
            <BookOpen className="w-12 h-12 text-slate-500" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Nemate još uvek odobrenih sertifikata</h2>
          <p className="text-slate-400 max-w-md mx-auto">
            Završite svoj paket edukacije, radite vredno i kada ispunite uslove, vaš profesor će vam odobriti sertifikat koji će se pojaviti ovde!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-white mb-8 flex items-center gap-2">
        <Award className="w-8 h-8 text-amber-400" />
        Moji Sertifikati
      </h1>

      <div className="space-y-12">
        {certificates.map((cert: any) => (
          <div key={cert._id} className="flex flex-col items-center">
            {/* The Certificate UI to be captured */}
            <div className="w-full overflow-hidden flex justify-center mb-6">
              <div 
                ref={el => { certRefs.current[cert._id] = el; }}
                className="w-[1123px] h-[794px] relative flex flex-col items-center text-center shrink-0 bg-[#fdfaf6] overflow-hidden"
                style={{
                  boxShadow: '0 0 50px rgba(0,0,0,0.2)',
                  fontFamily: '"Times New Roman", Times, serif',
                  color: '#000000'
                }}
              >
                {/* Background Decorators */}
                {/* Top Right Green/Gray Triangles */}
                <div className="absolute top-0 right-0 w-[150px] h-[180px]" style={{ zIndex: 1 }}>
                  <div className="absolute top-0 right-0 w-[150px] h-[180px] bg-[#00b050]" style={{ clipPath: 'polygon(100% 0, 0 0, 100% 100%)' }}></div>
                  <div className="absolute top-0 right-0 w-[80px] h-[100px] bg-[#606060]" style={{ clipPath: 'polygon(100% 0, 0 0, 100% 100%)' }}></div>
                </div>
                
                {/* Bottom Left Green/Gray Triangles */}
                <div className="absolute bottom-0 left-0 w-[110px] h-[180px]" style={{ zIndex: 1 }}>
                  <div className="absolute bottom-0 left-0 w-[110px] h-[180px] bg-[#00b050]" style={{ clipPath: 'polygon(0 100%, 0 0, 100% 100%)' }}></div>
                  <div className="absolute bottom-0 left-0 w-[60px] h-[100px] bg-[#606060]" style={{ clipPath: 'polygon(0 100%, 0 0, 100% 100%)' }}></div>
                </div>

                {/* Thin Colored Borders */}
                <div className="absolute top-8 left-0 w-full h-[2px] bg-[#8bc34a]" style={{ zIndex: 2 }}></div>
                <div className="absolute top-12 left-0 w-full h-[2px] bg-[#ffc107]" style={{ zIndex: 2 }}></div>
                
                <div className="absolute bottom-12 left-0 w-full h-[2px] bg-[#ffc107]" style={{ zIndex: 2 }}></div>
                <div className="absolute bottom-8 left-0 w-full h-[2px] bg-[#8bc34a]" style={{ zIndex: 2 }}></div>

                <div className="absolute top-0 left-12 w-[3px] h-full bg-[#d32f2f]" style={{ zIndex: 2 }}></div>
                <div className="absolute top-0 left-16 w-[1px] h-full bg-[#ffc107]" style={{ zIndex: 2 }}></div>

                <div className="absolute top-0 right-16 w-[1px] h-full bg-[#ffc107]" style={{ zIndex: 2 }}></div>
                <div className="absolute top-0 right-12 w-[3px] h-full bg-[#d32f2f]" style={{ zIndex: 2 }}></div>

                {/* Content Container */}
                <div className="relative z-10 w-full h-full flex flex-col items-center pt-[90px] px-24">
                  
                  <h1 className="text-7xl font-bold tracking-widest mb-4" style={{ fontFamily: '"Times New Roman", serif' }}>
                    CERTIFICATE
                  </h1>
                  
                  <h2 className="text-2xl tracking-[0.2em] text-[#333333] mb-8 uppercase">
                    OF COMPLETION OF {cert.courseName.toUpperCase()} COURSE
                  </h2>

                  <h3 className="text-6xl font-bold mb-12" style={{ fontFamily: '"Times New Roman", serif', letterSpacing: '0.05em' }}>
                    {cert.studentId?.firstName?.toUpperCase()} {cert.studentId?.lastName?.toUpperCase()}
                  </h3>

                  <p className="text-sm leading-relaxed text-[#333333] max-w-4xl mx-auto uppercase tracking-wider mb-auto" style={{ fontFamily: 'Arial, sans-serif', fontWeight: 600 }}>
                    {cert.courseName.toLowerCase().includes('html') ? (
                      "THE PARTICIPANT HAS DEMONSTRATED PROFICIENCY IN USING HTML5 TO CREATE STRUCTURED AND SEMANTICALLY CORRECT WEB PAGES, INCLUDING WORKING WITH FORMS, MULTIMEDIA, AND THE FUNDAMENTALS OF ACCESSIBILITY."
                    ) : cert.courseName.toLowerCase().includes('css') ? (
                      "THE PARTICIPANT HAS DEMONSTRATED STRONG PROFICIENCY IN USING CSS3 TO DESIGN MODERN, RESPONSIVE, AND VISUALLY CONSISTENT WEB INTERFACES, INCLUDING LAYOUT TECHNIQUES (FLEXBOX AND GRID), RESPONSIVE DESIGN PRINCIPLES, ANIMATIONS AND TRANSITIONS, STYLING BEST PRACTICES, AND CROSS-BROWSER COMPATIBILITY."
                    ) : cert.courseName.toLowerCase().includes('javascript') || cert.courseName.toLowerCase().includes('js') ? (
                      "THE PARTICIPANT HAS SUCCESSFULLY COMPLETED ADVANCED JAVASCRIPT TRAINING, DEMONSTRATING IN-DEPTH KNOWLEDGE OF MODERN JAVASCRIPT CONCEPTS AND BEST PRACTICES. THIS CERTIFICATION CONFIRMS THE ABILITY TO BUILD ROBUST, HIGH-PERFORMANCE, AND MAINTAINABLE WEB APPLICATIONS USING MODERN JAVASCRIPT STANDARDS."
                    ) : (
                      `THE PARTICIPANT HAS SUCCESSFULLY COMPLETED THE ${cert.courseName.toUpperCase()} TRAINING, DEMONSTRATING PROFICIENCY AND IN-DEPTH KNOWLEDGE OF CONCEPTS AND BEST PRACTICES REQUIRED FOR THIS CERTIFICATION.`
                    )}
                  </p>

                  <div className="w-full flex justify-between items-end pb-16 px-12">
                    {/* Left: Elegant Code Logo text representation */}
                    <div className="flex flex-col items-center w-64">
                      <img src="/ec-logo.png" alt="Elegant Code Logo" className="h-16 w-auto mb-4 mix-blend-multiply" style={{ objectFit: 'contain' }} />
                      <div className="w-full h-[2px] bg-black mb-2"></div>
                      <p className="text-sm tracking-widest font-bold">ELEGANT CODE</p>
                    </div>

                    {/* Middle: Gold Ribbon */}
                    <div className="relative flex flex-col items-center justify-center w-32 h-32 mb-4">
                      {/* Ribbon tails */}
                      <div className="absolute top-[60px] left-[15px] w-8 h-24 bg-[#b71c1c]" style={{ transform: 'rotate(25deg)', zIndex: 1 }}>
                        <div className="absolute bottom-0 w-full h-4 bg-[#fdfaf6]" style={{ clipPath: 'polygon(0 100%, 50% 0, 100% 100%)' }}></div>
                      </div>
                      <div className="absolute top-[60px] right-[15px] w-8 h-24 bg-[#b71c1c]" style={{ transform: 'rotate(-25deg)', zIndex: 1 }}>
                        <div className="absolute bottom-0 w-full h-4 bg-[#fdfaf6]" style={{ clipPath: 'polygon(0 100%, 50% 0, 100% 100%)' }}></div>
                      </div>
                      
                      {/* Gold Seal */}
                      <div className="w-24 h-24 bg-[#ffca28] rounded-full border-[6px] border-[#ff8f00] relative z-10 flex items-center justify-center shadow-lg" style={{ boxShadow: '0 4px 6px rgba(0,0,0,0.3), inset 0 0 10px rgba(255,255,255,0.5)' }}>
                        <div className="w-[86px] h-[86px] rounded-full border border-[#ffe082]"></div>
                      </div>
                    </div>

                    {/* Right: Signature and Date */}
                    <div className="flex flex-col items-center w-64">
                      <p className="font-serif text-xl mb-2">{cert.studentId?.firstName?.toUpperCase()} {cert.studentId?.lastName?.toUpperCase()}</p>
                      <div className="w-full h-[2px] bg-black mb-1"></div>
                      <p className="text-sm tracking-widest uppercase font-bold">DATUM: {format(new Date(cert.issueDate), 'dd.MM.yyyy.')}</p>
                      <p className="text-xs tracking-widest mt-2 font-mono text-[#555555]">ID: {cert.certificateId}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Download Button */}
            <button
              onClick={() => handleDownloadPDF(cert)}
              disabled={downloadingId === cert._id}
              className="px-8 py-4 bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold rounded-xl transition-all shadow-lg shadow-amber-500/20 flex items-center gap-3 disabled:opacity-50"
            >
              {downloadingId === cert._id ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Download className="w-5 h-5" />
              )}
              {downloadingId === cert._id ? 'Generisanje PDF-a...' : 'Preuzmi Sertifikat (PDF)'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
