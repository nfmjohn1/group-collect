import React from 'react';

const Links: React.FC = () => {
  const links = [
    {
      title: 'Documentation',
      url: '#',
      description: 'Learn how to use Group Collect',
    },
    {
      title: 'Support',
      url: '#',
      description: 'Get help with your account',
    },
    {
      title: 'Facebook Group',
      url: '#',
      description: 'Join our community',
    },
    {
      title: 'Video Tutorials',
      url: '#',
      description: 'Watch how-to videos',
    },
    {
      title: 'Affiliate Program',
      url: '#',
      description: 'Earn by referring others',
    },
  ];

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-6">Useful Links</h2>

      <div className="space-y-4">
        {links.map((link, index) => (
          <a
            key={index}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <h3 className="font-semibold text-primary mb-1">{link.title}</h3>
            <p className="text-sm text-gray-600">{link.description}</p>
          </a>
        ))}
      </div>
    </div>
  );
};

export default Links;
