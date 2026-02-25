
import React from 'react';
import HomeHeader from '../components/home/HomeHeader';
import CategoryList from '../components/home/CategoryList';
import { goals, categories } from '../components/home/mockData';
import '../components/home/Home.scss';

const Home: React.FC = () => {
  return (
    <div className="home-container">
      <HomeHeader goals={goals} />
      <CategoryList categories={categories} />
    </div>
  );
};

export default Home;
