export interface AnimalItem {
  id: string;
  hindi: string;
  english: string;
  image: string;
  santhaliAudio: string;
  mundariAudio: string;
}

export const animalData: AnimalItem[] = [
  { id: 'bird', hindi: 'चिड़िया', english: 'Bird', image: '/assets/animals/bird.png', santhaliAudio: '/assets/animals/audios/bird-santhali.mp3', mundariAudio: '/assets/animals/audios/bird_mundari.mp3' },
  { id: 'cat', hindi: 'बिल्ली', english: 'Cat', image: '/assets/animals/cat.png', santhaliAudio: '/assets/animals/audios/cat-santhali.mp3', mundariAudio: '/assets/animals/audios/cat_mundari.mp3' },
  { id: 'cow', hindi: 'गाय', english: 'Cow', image: '/assets/animals/cow.png', santhaliAudio: '/assets/animals/audios/cow-santhali.mp3', mundariAudio: '/assets/animals/audios/cow_mundari.mp3' },
  { id: 'dog', hindi: 'कुत्ता', english: 'Dog', image: '/assets/animals/dog.png', santhaliAudio: '/assets/animals/audios/dog_santhali.mp3', mundariAudio: '/assets/animals/audios/dog_mundari.mp3' },
  { id: 'elephant', hindi: 'हाथी', english: 'Elephant', image: '/assets/animals/elephant.png', santhaliAudio: '/assets/animals/audios/elephant_santhali.mp3', mundariAudio: '/assets/animals/audios/elephant_mundari.mp3' },
  { id: 'goat', hindi: 'बकरी', english: 'Goat', image: '/assets/animals/goat.png', santhaliAudio: '/assets/animals/audios/goat_santhali.mp3', mundariAudio: '/assets/animals/audios/goat_mundari.mp3' },
  { id: 'hen', hindi: 'मुर्गी', english: 'Hen', image: '/assets/animals/hen.png', santhaliAudio: '/assets/animals/audios/hen_santhali.mp3', mundariAudio: '/assets/animals/audios/hen_mundari.mp3' },
  { id: 'monkey', hindi: 'बंदर', english: 'Monkey', image: '/assets/animals/monkey.png', santhaliAudio: '/assets/animals/audios/monkey_santhali.mp3', mundariAudio: '/assets/animals/audios/monkey_mundari.mp3' },
  { id: 'pig', hindi: 'सुअर', english: 'Pig', image: '/assets/animals/pig.png', santhaliAudio: '/assets/animals/audios/pig_santhali.mp3', mundariAudio: '/assets/animals/audios/pig_mundari.mp3' },
  { id: 'sheep', hindi: 'भेड़', english: 'Sheep', image: '/assets/animals/sheep.png', santhaliAudio: '/assets/animals/audios/sheep_santhali.mp3', mundariAudio: '/assets/animals/audios/sheep_mundari.mp3' }
];
