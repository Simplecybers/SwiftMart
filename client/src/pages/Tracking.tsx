import { useTracking } from "@/hooks/use-tracking";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useRoute, useLocation } from "wouter";
import { Loader2, Package, MapPin, Search } from "lucide-react";
import Map from "@/components/Map";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useState } from "react";

export default function Tracking() {
  const [, params] = useRoute("/track/:trackingNumber");
  const [, setLocation] = useLocation();
  const trackingNumber = params?.trackingNumber || "";
  const [searchInput, setSearchInput] = useState(trackingNumber);

  const { data: shipment, isLoading, error } = useTracking(trackingNumber);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setLocation(`/track/${searchInput.trim()}`);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-12">
      <Navbar />

      <div className="container px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-4 mb-12">
            <h1 className="text-3xl font-display font-bold">Track Your Order</h1>
            <form onSubmit={handleSearch} className="flex gap-2 max-w-md mx-auto">
              <Input
                placeholder="Enter Tracking ID (e.g. GS-1234-5678)"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="h-12 text-lg"
              />
              <Button type="submit" size="lg" className="h-12 px-6">
                <Search className="h-5 w-5" />
              </Button>
            </form>
          </div>

          {!trackingNumber ? (
            <div className="text-center py-12 text-muted-foreground">
              Enter a tracking number to see shipment details.
            </div>
          ) : isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : !shipment ? (
            <Card className="border-destructive/50 bg-destructive/5">
              <CardContent className="flex flex-col items-center py-12 text-center">
                <Package className="h-12 w-12 text-destructive mb-4" />
                <h3 className="text-xl font-bold text-destructive mb-2">Shipment Not Found</h3>
                <p className="text-muted-foreground">
                  We couldn't find a shipment with tracking number: <span className="font-mono font-bold text-foreground">{trackingNumber}</span>
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-8 animate-in slide-in-from-bottom duration-500">
              {/* Header Card */}
              <Card className="overflow-hidden border-l-4 border-l-primary shadow-lg shadow-primary/5">
                <CardHeader className="bg-secondary/30 pb-8">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground uppercase tracking-wider font-semibold mb-1">Tracking Number</p>
                      <h2 className="text-3xl font-mono font-bold text-primary">{shipment.trackingNumber}</h2>
                    </div>
                    <div className="flex flex-col items-end">
                      <Badge className={cn(
                        "text-lg px-4 py-1 mb-2 capitalize",
                        shipment.status === 'delivered' ? 'bg-green-500 hover:bg-green-600' : 'bg-primary hover:bg-primary/90'
                      )}>
                        {shipment.status.replace('_', ' ')}
                      </Badge>
                      <p className="text-sm text-muted-foreground">
                        Carrier: <span className="font-semibold text-foreground">{shipment.carrier}</span>
                      </p>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              <div className="grid lg:grid-cols-2 gap-8">
                {/* Timeline */}
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5 text-primary" />
                      Shipment Progress
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="relative pl-6 border-l-2 border-muted space-y-8">
                      {shipment.logs.map((log, index) => (
                        <div key={log.id} className="relative">
                          <div className={cn(
                            "absolute -left-[31px] top-0 h-4 w-4 rounded-full border-2 border-background",
                            index === 0 ? "bg-primary ring-4 ring-primary/20" : "bg-muted-foreground"
                          )} />
                          <div className="space-y-1">
                            <p className="font-bold text-lg leading-none capitalize">
                              {log.status.replace('_', ' ')}
                            </p>
                            <div className="flex items-center text-sm text-muted-foreground gap-2">
                              <MapPin className="h-3 w-3" />
                              {log.location}
                            </div>
                            <p className="text-xs text-muted-foreground pt-1">
                              {log.timestamp && format(new Date(log.timestamp), "MMM d, yyyy 'at' h:mm a")}
                            </p>
                            {log.note && (
                              <p className="text-sm bg-secondary/50 p-2 rounded mt-2">
                                {log.note}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Map */}
                <Card className="h-full min-h-[400px] overflow-hidden">
                  <Map logs={shipment.logs} className="w-full h-full min-h-[400px]" />
                </Card>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
