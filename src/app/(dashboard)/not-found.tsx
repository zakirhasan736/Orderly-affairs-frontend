'use client';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="not-found-wrapper py-12 h-[80vh]">
      <div className="custom-container h-full">
        <div className="not-found-cont flex flex-col justify-center items-center h-full">
          <h4 className="text-center">Not Found</h4>
          <p className="text-center">Could not find requested resource</p>
          <Link href="/" className="primary-btn btn-styles mt-6 mx-auto block">
            Return Home
          </Link>
        </div>
      </div>
    </div>
  );
}
