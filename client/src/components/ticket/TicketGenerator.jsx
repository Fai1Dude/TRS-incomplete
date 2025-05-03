// src/components/ui/ticket-generator.jsx
import React, { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QRCodeSVG } from 'qrcode.react';
import { 
  Download, 
  Printer, 
  Train, 
  Calendar, 
  Clock, 
  User, 
  CreditCard,
  Award
} from 'lucide-react';

const TicketGenerator = ({ ticketDetails }) => {
  const ticketRef = useRef();
  
  const handlePrint = useReactToPrint({
    content: () => ticketRef.current,
  });

  const handleDownload = () => {
    const element = document.createElement('a');
    const file = new Blob([JSON.stringify(ticketDetails, null, 2)], {
      type: 'application/json'
    });
    element.href = URL.createObjectURL(file);
    element.download = `ticket-${ticketDetails.reservationId}.json`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const Ticket = React.forwardRef((props, ref) => (
    <div ref={ref} className="p-8 bg-white">
      <div className="border-4 border-primary/20 p-6 rounded-lg">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-primary">Train Ticket</h1>
            <p className="text-gray-500">Booking #{ticketDetails.reservationId}</p>
          </div>
          <div className="flex flex-col items-end">
            <QRCodeSVG 
              value={`TICKET-${ticketDetails.reservationId}`} 
              size={96}
            />
            <p className="text-sm text-gray-500 mt-2">Scan for verification</p>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h2 className="font-semibold flex items-center gap-2">
              <Train className="w-5 h-5" />
              Journey Details
            </h2>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">From</span>
                <span className="font-medium">{ticketDetails.from}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">To</span>
                <span className="font-medium">{ticketDetails.to}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Date</span>
                <span className="font-medium">
                  {new Date(ticketDetails.date).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Time</span>
                <span className="font-medium">{ticketDetails.departureTime}</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="font-semibold flex items-center gap-2">
              <User className="w-5 h-5" />
              Passenger Details
            </h2>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Name</span>
                <span className="font-medium">{ticketDetails.passengerName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Coach</span>
                <span className="font-medium">{ticketDetails.coach}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Seat</span>
                <span className="font-medium">{ticketDetails.seatNumber}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t">
          <div className="flex justify-between items-center">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-gray-500" />
                <span className="text-gray-500">Payment Confirmed</span>
              </div>
              <p className="font-medium">Amount Paid: SAR {ticketDetails.amount}</p>
            </div>
            <div className="text-right space-y-1">
              <p className="text-sm text-gray-500">
                Please arrive 30 minutes before departure
              </p>
              <p className="text-sm text-gray-500">
                Keep this ticket for verification
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  ));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Ticket</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <Ticket ref={ticketRef} />
          
          <div className="flex justify-end space-x-4">
            <Button 
              variant="outline" 
              onClick={handlePrint}
              className="flex items-center gap-2"
            >
              <Printer className="w-4 h-4" />
              Print Ticket
            </Button>
            <Button 
              onClick={handleDownload}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download E-Ticket
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TicketGenerator;