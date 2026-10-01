import collage1 from '../assets/charity/collage1.webp';
import collage2 from '../assets/charity/collage2.jpg';
import collage3 from '../assets/charity/collage3.webp';
import collage4 from '../assets/charity/collage4.jpg';
import collage5 from '../assets/charity/collage5.jpg';
import collage6 from '../assets/charity/collage6.webp';
import collage7 from '../assets/charity/collage7.webp';
import collage8 from '../assets/charity/collage8.jpg';
import collage9 from '../assets/charity/collage9.jpg';
import collage10 from '../assets/charity/collage10.webp';

export default function HeroCarousel({ approvedVolunteerCount }) {
  return (
    <div className="relative w-full h-[420px] rounded-[2.5rem] overflow-hidden bg-[#092B22] shadow-2xl flex flex-col lg:flex-row border border-[#164336]">

      {/* LEFT CONTENT */}
      <div className="p-8 lg:p-10 lg:w-2/5 z-10 flex flex-col justify-center bg-gradient-to-br from-[#092B22] to-[#0A2921]">

        <div className="inline-flex items-center gap-2 bg-[#0F9F76]/20 border border-[#0F9F76]/30 text-[#34D399] text-[10px] font-black px-3.5 py-1.5 rounded-full w-fit mb-5 uppercase tracking-widest">
          <span className="text-sm">🌱</span>
          RescueBite Dhaka
        </div>

        <h1 className="text-3xl md:text-4xl lg:text-[2.5rem] font-extrabold text-white tracking-tight leading-[1.1]">
          Every Meal <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#34D399] to-[#0F9F76]">
            Finds a Home.
          </span>
        </h1>

        <p className="text-stone-300/90 text-sm md:text-base mt-5 leading-relaxed font-medium max-w-md">
          Bridging the gap between surplus food and the community. Join us in reducing waste and nourishing families and shelters across the city.
        </p>

        <div className="mt-8 flex items-center gap-3">
          <div className="flex -space-x-3">
            <img
              src={collage4}
              className="w-9 h-9 rounded-full border-2 border-[#092B22] object-cover"
              alt="Volunteer"
            />
            <img
              src={collage8}
              className="w-9 h-9 rounded-full border-2 border-[#092B22] object-cover"
              alt="Volunteer"
            />
            <img
              src={collage10}
              className="w-9 h-9 rounded-full border-2 border-[#092B22] object-cover"
              alt="Volunteer"
            />
          </div>

          <div className="text-xs text-stone-300 font-medium">
            {Number.isFinite(approvedVolunteerCount)
              ? <>Join <span className="text-white font-bold">{approvedVolunteerCount.toLocaleString()}</span> Volunteers</>
              : 'Join our volunteer community'}
          </div>
        </div>
      </div>

      {/* RIGHT COLLAGE */}
      <div className="lg:w-3/5 w-full p-3 lg:p-4 bg-[#08241C] min-h-0">
        
        <div className="grid grid-cols-4 grid-rows-6 gap-2.5 w-full h-full">

          {/* LEFT COLUMN — 3 IMAGES */}
          <CollageImage
            src={collage1}
            className="col-start-1 row-start-1 row-span-2"
          />

          <CollageImage
            src={collage2}
            className="col-start-1 row-start-3 row-span-2"
          />

          <CollageImage
            src={collage3}
            className="col-start-1 row-start-5 row-span-2"
          />

          {/* CENTER — LARGE IMAGE */}
          <CollageImage
            src={collage4}
            className="col-start-2 col-span-2 row-start-1 row-span-3"
          />

          {/* CENTER — TWO SMALL IMAGES */}
          <CollageImage
            src={collage5}
            className="col-start-2 row-start-4 row-span-1"
          />

          <CollageImage
            src={collage6}
            className="col-start-3 row-start-4 row-span-1"
          />

          {/* CENTER — BOTTOM IMAGE */}
          <CollageImage
            src={collage7}
            className="col-start-2 col-span-2 row-start-5 row-span-2"
          />

          {/* RIGHT COLUMN — 3 IMAGES */}
          <CollageImage
            src={collage8}
            className="col-start-4 row-start-1 row-span-2"
          />

          <CollageImage
            src={collage9}
            className="col-start-4 row-start-3 row-span-2"
          />

          <CollageImage
            src={collage10}
            className="col-start-4 row-start-5 row-span-2"
          />

        </div>
      </div>
    </div>
  );
}

function CollageImage({ src, className = '' }) {
  return (
    <div
      className={`relative min-h-0 min-w-0 overflow-hidden rounded-[1.25rem] ${className}`}
    >
      <img
        src={src}
        alt="Food Rescue"
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out hover:scale-105"
      />
    </div>
  );
}