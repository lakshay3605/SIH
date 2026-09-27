export interface AnimalItem {
  id: string;
  hindi: string;
  english: string;
  image: string;
  santhaliAudio: string;
  mundariAudio: string;
}

export const animalData: AnimalItem[] = [
  { id: 'bird', hindi: 'चिड़िया', english: 'Bird', image: '/assets/animals/bird.png', santhaliAudio: '/assets/animals/bird-santali.mp3', mundariAudio: '/assets/animals/bird_mundari.mp3' },
  { id: 'cat', hindi: 'बिल्ली', english: 'Cat', image: '/assets/animals/cat.png', santhaliAudio: '/assets/animals/cat-santali.mp3', mundariAudio: '/assets/animals/cat_mundari.mp3' },
  { id: 'cow', hindi: 'गाय', english: 'Cow', image: '/assets/animals/cow.png', santhaliAudio: '/assets/animals/cow-santali.mp3', mundariAudio: '/assets/animals/cow_mundari.mp3' },
  { id: 'dog', hindi: 'कुत्ता', english: 'Dog', image: '/assets/animals/dog.png', santhaliAudio: '/assets/animals/dog_santali.mp3', mundariAudio: '/assets/animals/dog_mundari.mp3' },
  { id: 'elephant', hindi: 'हाथी', english: 'Elephant', image: '/assets/animals/elephant.png', santhaliAudio: '/assets/animals/elephant_santali.mp3', mundariAudio: '/assets/animals/elephant_mundari.mp3' },
  { id: 'goat', hindi: 'बकरी', english: 'Goat', image: '/assets/animals/goat.png', santhaliAudio: '/assets/animals/goat_santali.mp3', mundariAudio: '/assets/animals/goat_mundari.mp3' },
  { id: 'hen', hindi: 'मुर्गी', english: 'Hen', image: '/assets/animals/hen.png', santhaliAudio: '/assets/animals/hen_santali.mp3', mundariAudio: '/assets/animals/hen_mundari.mp3' },
  { id: 'monkey', hindi: 'बंदर', english: 'Monkey', image: '/assets/animals/monkey.png', santhaliAudio: '/assets/animals/monkey_santali.mp3', mundariAudio: '/assets/animals/monkey_mundari.mp3' },
  { id: 'pig', hindi: 'सुअर', english: 'Pig', image: '/assets/animals/pig.png', santhaliAudio: '/assets/animals/pig_santali.mp3', mundariAudio: '/assets/animals/pig_mundari.mp3' },
  { id: 'sheep', hindi: 'भेड़', english: 'Sheep', image: '/assets/animals/sheep.png', santhaliAudio: '/assets/animals/sheep_santali.mp3', mundariAudio: '/assets/animals/sheep_mundari.mp3' }
];
