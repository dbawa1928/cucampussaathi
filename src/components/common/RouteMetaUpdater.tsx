import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ROUTE_TITLES: Record<string, { title: string; description: string }> = {
  '/': {
    title: 'CUCampusSaathi — AI-Powered University Knowledge & Collaboration Platform',
    description: 'Discover skills, connect with mentors, find teammates, and turn academic knowledge into real-world projects.',
  },
  '/about': {
    title: 'About Us — CUCampusSaathi',
    description: 'Learn about our mission, vision, core principles, and the Chandigarh University team building CUCampusSaathi.',
  },
  '/features': {
    title: 'Features & Services — CUCampusSaathi',
    description: 'Explore AI Document Tutor, SkillGraph, Team Matcher, and FacultyConnect appointment booking.',
  },
  '/how-it-works': {
    title: 'How It Works — CUCampusSaathi',
    description: 'Step-by-step role workflows for students, faculty mentors, and university administration.',
  },
  '/contact': {
    title: 'Contact Us — CUCampusSaathi',
    description: 'Reach out to university coordinators, support, and administrative teams.',
  },
  '/help': {
    title: 'Help Center & FAQs — CUCampusSaathi',
    description: 'Frequently asked questions, search guides, and platform documentation.',
  },
  '/login': {
    title: 'Sign In — CUCampusSaathi',
    description: 'Access your university student, faculty, or administrator account.',
  },
  '/register': {
    title: 'Create Account — CUCampusSaathi',
    description: 'Join the CUCampusSaathi platform using your university student or faculty credentials.',
  },
  '/forgot-password': {
    title: 'Forgot Password — CUCampusSaathi',
    description: 'Reset your university account password securely.',
  },
  '/privacy': {
    title: 'Privacy Policy — CUCampusSaathi',
    description: 'Understand how university data, student portfolios, and uploaded documents are handled.',
  },
  '/terms': {
    title: 'Terms & Conditions — CUCampusSaathi',
    description: 'Institutional terms, conditions, and acceptable use policies for CUCampusSaathi.',
  },
};

export const RouteMetaUpdater: React.FC = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    const meta = ROUTE_TITLES[pathname] || {
      title: 'Page Not Found — CUCampusSaathi',
      description: 'The requested campus page could not be located.',
    };

    document.title = meta.title;

    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute('content', meta.description);
  }, [pathname]);

  return null;
};
