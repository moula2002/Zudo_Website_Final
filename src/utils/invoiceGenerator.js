import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const generateInvoice = (order) => {
  const doc = new jsPDF();
  const orderId = order._id.slice(-6).toUpperCase();
  const date = new Date(order.createdAt).toLocaleDateString('en-IN');

  // Set colors
  const primaryColor = [16, 117, 105]; // #107569 (Emerald)
  const secondaryColor = [51, 51, 51];

  // Header
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, 210, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.text('ZUDO', 20, 25);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Premium Grocery Collection', 20, 32);

  doc.setFontSize(14);
  doc.text('INVOICE', 160, 25);
  doc.setFontSize(10);
  doc.text(`#${orderId}`, 160, 32);

  // Billing Details
  doc.setTextColor(...secondaryColor);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Bill To:', 20, 60);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  const user = order.userId || {};
  const billingName = user.businessName || order.shippingAddress.name || 'Customer';
  doc.text(billingName, 20, 68);
  if (user.gstNumber) {
    doc.setFontSize(8);
    doc.text(`GST: ${user.gstNumber}`, 20, 72);
    doc.setFontSize(10);
  }
  
  const addressY = user.gstNumber ? 78 : 74;
  doc.text(order.shippingAddress.address || '', 20, addressY);
  doc.text(`${order.shippingAddress.city || ''}, ${order.shippingAddress.pincode || ''}`, 20, addressY + 6);
  doc.text(`Phone: ${order.shippingAddress.phone || ''}`, 20, addressY + 12);

  // Invoice Details
  doc.setFont('helvetica', 'bold');
  doc.text('Invoice Details:', 130, 60);
  doc.setFont('helvetica', 'normal');
  doc.text(`Date: ${date}`, 130, 68);
  doc.text(`Order Status: ${order.orderStatus}`, 130, 74);
  doc.text(`Payment: ${order.paymentMethod}`, 130, 80);

  // Items Table
  const tableData = order.items.map((item, index) => [
    index + 1,
    item.name || item.product?.name || 'Unknown Product',
    `₹${item.price}`,
    item.quantity,
    `₹${item.price * item.quantity}`
  ]);

  autoTable(doc, {
    startY: 100,
    head: [['#', 'Item', 'Price', 'Qty', 'Subtotal']],
    body: tableData,
    headStyles: { fillColor: primaryColor, textColor: [255, 255, 255] },
    alternateRowStyles: { fillColor: [245, 250, 249] },
    margin: { left: 20, right: 20 },
    theme: 'grid'
  });

  // Total
  const finalY = doc.lastAutoTable.finalY + 10;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Total Amount:', 130, finalY);
  doc.setTextColor(...primaryColor);
  doc.text(`INR ${order.totalAmount}`, 170, finalY);

  // Footer
  doc.setTextColor(150, 150, 150);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.text('Thank you for shopping with Zudo!', 105, 280, { align: 'center' });
  doc.text('This is a computer-generated invoice.', 105, 285, { align: 'center' });

  // Save the PDF
  doc.save(`Zudo_Invoice_${orderId}.pdf`);
};
