export interface Restaurant { id:string; nome:string; tipo:string; indirizzo:string; citta:string; logo:string; colore:string; }
export const RESTAURANTS_MOCK: Restaurant[] = [
{id:'rest-001',nome:'La Cantina di Marco',tipo:'Ristorante Fine Dining',indirizzo:'Via Roma 12',citta:'Milano',logo:'LC',colore:'#7B2D3E'},
{id:'rest-002',nome:'Osteria del Borgo',tipo:'Osteria Tradizionale',indirizzo:'Piazza Navona 5',citta:'Roma',logo:'OB',colore:'#5B8DB8'},
{id:'rest-003',nome:'Enoteca Toscana',tipo:'Enoteca & Bistrot',indirizzo:'Lungarno Corsini 8',citta:'Firenze',logo:'ET',colore:'#8B5E3C'}];
