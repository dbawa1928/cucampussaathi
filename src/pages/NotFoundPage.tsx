import React from 'react';
import { Link } from 'react-router-dom';
import { Home, HelpCircle } from 'lucide-react';

import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center py-20 px-4 sm:px-6 lg:px-8 text-center bg-[#F6F8FC]">
      <div className="w-full max-w-lg">
        <Badge variant="primary" size="md" className="mb-4">
          Error 404
        </Badge>

        <h1 className="text-4xl sm:text-6xl font-black text-[#17233B] tracking-tight">
          Page Not Found
        </h1>

        <p className="mt-4 text-base sm:text-lg text-[#64748B] leading-relaxed">
          The campus page or resource you requested could not be located. It may have been moved, renamed, or is currently restricted.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button
            to="/"
            variant="primary"
            size="lg"
            icon={<Home className="w-4 h-4" />}
          >
            Return to Homepage
          </Button>
          <Button
            to="/help"
            variant="outline"
            size="lg"
            icon={<HelpCircle className="w-4 h-4" />}
          >
            Visit Help Center
          </Button>
        </div>

        <div className="mt-12 pt-8 border-t border-[#E2E8F0] grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs text-[#64748B]">
          <Link to="/features" className="p-2.5 rounded-lg bg-white border border-[#E2E8F0] hover:border-[#3157D5] hover:text-[#3157D5] transition-colors">
            Platform Features
          </Link>
          <Link to="/how-it-works" className="p-2.5 rounded-lg bg-white border border-[#E2E8F0] hover:border-[#3157D5] hover:text-[#3157D5] transition-colors">
            How It Works
          </Link>
          <Link to="/contact" className="col-span-2 sm:col-span-1 p-2.5 rounded-lg bg-white border border-[#E2E8F0] hover:border-[#3157D5] hover:text-[#3157D5] transition-colors">
            Contact Support
          </Link>
        </div>
      </div>
    </div>
  );
};
