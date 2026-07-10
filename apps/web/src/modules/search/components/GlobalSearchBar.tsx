import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export function GlobalSearchBar() {
  const [q, setQ] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = q.trim();
    if (query.length >= 2) {
      navigate(`/dashboard/recherche?q=${encodeURIComponent(query)}`);
      setQ('');
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="relative hidden lg:block">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Recherche globale…"
          className="w-56 pl-9"
        />
      </form>

      <Button
        variant="ghost"
        size="sm"
        className="h-9 w-9 p-0 lg:hidden"
        onClick={() => navigate('/dashboard/recherche')}
        aria-label="Rechercher"
      >
        <Search className="h-4 w-4" />
      </Button>
    </>
  );
}
