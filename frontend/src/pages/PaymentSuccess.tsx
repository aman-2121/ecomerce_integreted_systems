import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { verifyPayment } from '../api/payment';
import { orderAPI } from '../api/auth';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { jsPDF } from 'jspdf';

const PaymentSuccess: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { clearCart } = useCart();
  const { user } = useAuth();
  const orderId = searchParams.get('orderId');
  const tx_ref = searchParams.get('tx_ref');
  const [loading, setLoading] = useState(true);
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'success' | 'failed'>('pending');
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const hasVerified = React.useRef(false);

  useEffect(() => {
    const verifyPaymentStatus = async () => {
      if (tx_ref && !hasVerified.current) {
        hasVerified.current = true;
        try {
          console.log('Verifying payment with tx_ref:', tx_ref);
          const response = await verifyPayment(tx_ref);
          console.log('Verification response:', response);

          if (response.success) {
            setVerificationStatus('success');
            clearCart();

            // Use orderId from response if not in URL
            const finalOrderId = orderId || (response as any).orderId;
            console.log('Final Order ID for details:', finalOrderId);

            // Fetch order details for receipt generation
            if (finalOrderId) {
              try {
                // Wait for order details to be available for receipt
                const orderResponse = await orderAPI.getById(finalOrderId);
                if (orderResponse.data && orderResponse.data.order) {
                  setOrderDetails(orderResponse.data.order);
                  console.log('Order details loaded for receipt:', orderResponse.data.order);
                }
              } catch (orderError) {
                console.error('Failed to fetch order details for receipt:', orderError);
              }
            }
          } else {
            setVerificationStatus('failed');
          }
        } catch (error) {
          console.error('Payment verification failed:', error);
          setVerificationStatus('failed');
        }
      }

      // Set loading to false after verification attempt
      setLoading(false);
    };

    verifyPaymentStatus();
  }, [tx_ref, clearCart, orderId]);

  const generateReceipt = () => {
    try {
      if (!orderDetails || !user) {
        alert('Details not loaded yet.');
        return;
      }

      const doc = new jsPDF();

      // Colors from Chapa branding
      const chapaGreen = [139, 195, 74]; // #8bc34a
      const statusGreen = [40, 167, 69]; // #28a745
      const blackBar = [26, 26, 26]; // #1a1a1a

      // Header: Chapa Logo (Left) and RECEIPT (Right)
      doc.setFillColor(statusGreen[0], statusGreen[1], statusGreen[2]);
      doc.rect(20, 20, 12, 12, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('C', 26, 29, { align: 'center' });

      doc.setTextColor(50, 50, 50);
      doc.setFontSize(22);
      doc.text('Chapa', 35, 30);

      doc.setTextColor(chapaGreen[0], chapaGreen[1], chapaGreen[2]);
      doc.setFontSize(24);
      doc.setFont('helvetica', 'normal');
      doc.text('RECEIPT', 190, 30, { align: 'right' });

      // Dark horizontal bar
      doc.setFillColor(blackBar[0], blackBar[1], blackBar[2]);
      doc.rect(20, 38, 170, 2, 'F');

      // Receipt info section
      doc.setFontSize(10);
      doc.setTextColor(150, 150, 150);
      doc.text('RECEIPT FROM', 20, 50);
      doc.setTextColor(50, 50, 50);
      doc.setFont('helvetica', 'bold');
      doc.text('Test Business', 20, 56);
      doc.setFont('helvetica', 'normal');
      doc.text('TIN: Test TIN', 20, 62);
      doc.text('Phone No.: 09001234xx', 20, 68);
      doc.text('Address: Test Address', 20, 74);

      doc.setFont('helvetica', 'bold');
      doc.text('Chapa Financial Technologies S.C.', 100, 56);
      doc.setFont('helvetica', 'normal');
      doc.text('TIN: 0071495415', 100, 62);
      doc.text('VAT Reg: 12595770010', 100, 68);
      doc.text('Phone No.: +251 909774772', 100, 74);
      doc.text('Website: chapa.co', 100, 80);

      // Payment Details Table
      let y = 95;
      doc.setFillColor(chapaGreen[0], chapaGreen[1], chapaGreen[2]);
      doc.rect(20, y, 170, 10, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.text('PAYMENT DETAILS', 25, y + 7);
      doc.setFontSize(8);
      doc.text(tx_ref || '', 190, y + 7, { align: 'right' });

      y += 10;
      doc.setFontSize(10);
      doc.setTextColor(50, 50, 50);

      const rows = [
        ['FULL NAME', user.name || 'Customer'],
        ['PHONE NUMBER', user.phone || 'N/A'],
        ['EMAIL ADDRESS', user.email || 'N/A'],
        ['PAYMENT METHOD', 'Chapa'],
        ['STATUS', verificationStatus === 'success' ? 'Paid / Success' : 'Pending'],
        ['PAYMENT DATE', new Date().toLocaleDateString()],
        ['PAYMENT REASON', 'Paid for goods/services online']
      ];

      rows.forEach(row => {
        doc.setDrawColor(240, 240, 240);
        doc.line(20, y, 190, y);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(150, 150, 150);
        doc.text(row[0], 25, y + 7);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(50, 50, 50);
        if (row[0] === 'STATUS') {
          doc.setTextColor(statusGreen[0], statusGreen[1], statusGreen[2]);
        }
        doc.text(row[1], 80, y + 7);
        y += 10;
      });

      // Financials
      y += 15;
      const totalAmount = Number(orderDetails.totalAmount || 0);
      const charge = totalAmount * 0.15;
      const subTotal = totalAmount - charge;

      doc.setTextColor(150, 150, 150);
      doc.setFont('helvetica', 'normal');
      doc.text('SUB TOTAL', 130, y);
      doc.setTextColor(50, 50, 50);
      doc.text(`${subTotal.toFixed(2)} ETB`, 190, y, { align: 'right' });

      y += 8;
      doc.setTextColor(150, 150, 150);
      doc.text('CHARGE', 130, y);
      doc.setTextColor(50, 50, 50);
      doc.text(`${charge.toFixed(2)} ETB`, 190, y, { align: 'right' });

      y += 5;
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.5);
      doc.line(130, y, 190, y);

      y += 10;
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'bold');
      doc.text('TOTAL', 130, y);
      doc.text(`${totalAmount.toFixed(2)} ETB`, 190, y, { align: 'right' });

      // Footer
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.setFont('helvetica', 'italic');
      doc.text('This is a computer-generated receipt from Chapa Financial Technologies.', 105, 270, { align: 'center' });
      doc.text('Thank you for your business!', 105, 276, { align: 'center' });

      doc.save(`Chapa-Receipt-${tx_ref || orderId}.pdf`);
    } catch (err) {
      console.error('PDF error:', err);
      alert('Could not generate PDF.');
    }
  };

  const handleClose = () => {
    // Explicitly navigate away only when user clicks the button
    navigate('/products');
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-white dark:bg-gray-900 flex items-center justify-center z-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#28a745] mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading receipt details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 shadow-2xl rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
        {/* Header Section */}
        <div className="p-6 sm:p-8">
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center space-x-2">
              <div className="w-12 h-12 bg-[#28a745] rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-2xl italic">C</span>
              </div>
              <span className="text-2xl font-bold text-gray-800 dark:text-white">Chapa</span>
            </div>
            <div className="text-right">
              <h1 className="text-3xl font-light text-[#8bc34a] tracking-widest uppercase">RECEIPT</h1>
            </div>
          </div>

          <div className="h-2 bg-[#1a1a1a] mb-8"></div>

          {/* Info Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
            <div>
              <h3 className="text-gray-400 text-sm uppercase mb-2">Receipt From</h3>
              <div className="text-gray-700 dark:text-gray-300">
                <p className="font-bold text-lg">Test Business</p>
                <p>TIN: Test TIN</p>
                <p>Phone No.: 09001234xx</p>
                <p>Address: Test Address</p>
              </div>
            </div>
            <div className="text-right md:text-left md:pl-8 border-l-0 md:border-l border-gray-200 dark:border-gray-700">
              <div className="text-gray-700 dark:text-gray-300">
                <p className="font-bold text-lg">Chapa Financial Technologies S.C.</p>
                <p>TIN: 0071495415</p>
                <p>VAT Reg: 12595770010</p>
                <p>Phone No.: +251 909774772</p>
                <p>Website: chapa.co</p>
              </div>
            </div>
          </div>

          {/* Payment Details Section */}
          <div className="mb-8">
            <div className="bg-[#8bc34a] text-white px-4 py-2 uppercase font-semibold text-sm tracking-wider flex justify-between items-center rounded-t-sm">
              <span>Payment Details</span>
              <span className="text-xs font-mono font-normal opacity-90">{tx_ref || 'REFERENCE'}</span>
            </div>

            <div className="border border-t-0 border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-800">
              {[
                { label: 'Full Name', value: user?.name || 'Customer' },
                { label: 'Phone Number', value: user?.phone || 'N/A' },
                { label: 'Email Address', value: user?.email || 'N/A' },
                { label: 'Payment Method', value: 'Chapa' },
                { label: 'Status', value: verificationStatus === 'success' ? 'Paid / Success' : 'Pending', isStatus: true },
                { label: 'Payment Date', value: new Date().toLocaleDateString() },
                { label: 'Payment Reason', value: 'Paid for goods/services online' }
              ].map((row, idx) => (
                <div key={idx} className="flex flex-col sm:flex-row py-4 px-6 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <span className="w-full sm:w-1/3 text-gray-500 text-sm uppercase">{row.label}</span>
                  <span className={`w-full sm:w-2/3 font-medium ${row.isStatus ? 'text-[#28a745]' : 'text-gray-900 dark:text-white'}`}>
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing Section */}
          <div className="flex flex-col items-end space-y-2 mb-12">
            <div className="w-full sm:w-64 space-y-1">
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>Sub Total</span>
                <span>{orderDetails ? (Number(orderDetails.totalAmount) * 0.85).toFixed(2) : '0.00'} ETB</span>
              </div>
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>Charge</span>
                <span>{orderDetails ? (Number(orderDetails.totalAmount) * 0.15).toFixed(2) : '0.00'} ETB</span>
              </div>
              <div className="flex justify-between text-xl font-bold border-t-2 border-[#1a1a1a] pt-2 text-gray-900 dark:text-white">
                <span>Total</span>
                <span>{orderDetails ? Number(orderDetails.totalAmount).toFixed(2) : '0.00'} ETB</span>
              </div>
            </div>
          </div>

          {/* Actions Section */}
          <div className="flex flex-col sm:flex-row gap-4 no-print">
            <button
              onClick={generateReceipt}
              className="flex-1 bg-[#1a1a1a] text-white py-4 rounded font-bold hover:bg-black transition-all flex items-center justify-center space-x-2 shadow-lg"
              disabled={!orderDetails}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span>DOWNLOAD RECEIPT</span>
            </button>
            <button
              onClick={handleClose}
              className="flex-1 border-2 border-gray-300 text-gray-700 py-4 rounded font-bold hover:bg-gray-50 transition-all text-center dark:text-gray-300 dark:border-gray-600"
            >
              CONTINUE SHOPPING
            </button>
          </div>
        </div>

        {/* Custom Footer */}
        <div className="p-8 bg-gray-50 dark:bg-gray-800/80 border-t border-gray-200 dark:border-gray-700 text-center text-sm text-gray-500">
          <p>This is a computer-generated receipt from Chapa Financial Technologies.</p>
          <p className="mt-1">Thank you for your business!</p>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;
