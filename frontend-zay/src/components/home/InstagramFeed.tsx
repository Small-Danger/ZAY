
"use client"

import React, { useEffect } from 'react';
import { Instagram } from 'lucide-react';
import { motion } from 'framer-motion';

/**
 * Custom TikTok Icon SVG
 */
const TiktokIcon = ({ className }: { className?: string }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 0 1-5.201 1.743l-.002-.001.002.001a2.895 2.895 0 0 1 3.183-4.51v-3.5a6.329 6.329 0 0 0-5.394 10.692 6.33 6.33 0 0 0 10.857-4.424V8.617a8.171 8.171 0 0 0 4.773 1.574V6.686h-.003z"/>
  </svg>
);

const INSTAGRAM_POSTS = [
  "https://www.instagram.com/reel/DaGNHgJNsZg/",
  "https://www.instagram.com/reel/DWBxOWOjIAD/",
  "https://www.instagram.com/reel/DSx5aE0jH9F/",
];

export const InstagramFeed = () => {
  useEffect(() => {
    // Charger le script Instagram si ce n'est pas déjà fait
    const script = document.createElement('script');
    script.src = "//www.instagram.com/embed.js";
    script.async = true;
    document.body.appendChild(script);

    script.onload = () => {
      if ((window as any).instgrm) {
        (window as any).instgrm.Embeds.process();
      }
    };

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  return (
    <section className="py-24 bg-white">
      <div className="container mx-auto px-4">
        {/* Title Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
          <div className="space-y-4">
            <h2 className="text-[1.2rem] md:text-[1.6rem] lg:text-[2.2rem] font-black tracking-[0.25em] uppercase text-black border-l-8 border-primary pl-6">
              L'UNIVERS ZAY
            </h2>
            <p className="text-zay-text-muted text-sm italic tracking-widest pl-8 max-w-lg">
              Rejoignez-nous sur nos réseaux pour plus d'inspirations quotidiennes.
            </p>
          </div>

          <div className="flex items-center gap-6 pl-8 md:pl-0">
             <a href="https://www.instagram.com/zay_dresss/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[0.7rem] font-black tracking-[0.2em] uppercase text-black hover:text-primary transition-colors">
               <Instagram size={16} /> INSTAGRAM
             </a>
             <span className="w-px h-4 bg-zay-border" />
             <a href="https://www.tiktok.com/@zay_dresss" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[0.7rem] font-black tracking-[0.2em] uppercase text-black hover:text-primary transition-colors">
               <TiktokIcon className="w-4 h-4" /> TIKTOK
             </a>
          </div>
        </div>

        {/* Real Instagram Posts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {INSTAGRAM_POSTS.map((url, index) => (
            <motion.div 
              key={url}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="flex justify-center overflow-hidden rounded-lg shadow-sm"
            >
              {/* Le conteneur ci-dessous permet de masquer la partie basse via un overflow-hidden et un aspect-ratio adapté aux Reels */}
              <div className="w-full max-w-[400px] aspect-[9/14] overflow-hidden bg-gray-50 relative group">
                <blockquote 
                  className="instagram-media" 
                  data-instgrm-permalink={url}
                  data-instgrm-version="14" 
                  style={{ 
                    background: '#FFF', 
                    border: '0', 
                    borderRadius: '0', 
                    margin: '0', 
                    padding: '0', 
                    width: '100%',
                    height: '100%'
                  }}
                >
                  <div style={{ padding: '16px' }}>
                    <a href={url} style={{ background: '#FFFFFF', lineHeight: '0', textAlign: 'center', textDecoration: 'none', width: '100%' }} target="_blank" rel="noopener noreferrer">
                      <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                        <div style={{ backgroundColor: '#F4F4F4', borderRadius: '50%', flexGrow: 0, height: '40px', marginRight: '14px', width: '40px' }}></div>
                        <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, justifyContent: 'center' }}>
                          <div style={{ backgroundColor: '#F4F4F4', borderRadius: '4px', flexGrow: 0, height: '14px', marginBottom: '6px', width: '100px' }}></div>
                          <div style={{ backgroundColor: '#F4F4F4', borderRadius: '4px', flexGrow: 0, height: '14px', width: '60px' }}></div>
                        </div>
                      </div>
                      <div style={{ padding: '19% 0' }}></div>
                      <div style={{ display: 'block', height: '50px', margin: '0 auto 12px', width: '50px' }}>
                        <Instagram className="text-zay-text-muted opacity-20" size={50} strokeWidth={1} />
                      </div>
                      <div style={{ paddingTop: '8px' }}>
                        <div style={{ color: '#3897f0', fontFamily: 'Arial,sans-serif', fontSize: '14px', fontStyle: 'normal', fontWeight: '550', lineHeight: '18px' }}>
                          Lecture...
                        </div>
                      </div>
                    </a>
                  </div>
                </blockquote>
                
                {/* Overlay discret pour inviter au clic sans masquer la vidéo */}
                <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
