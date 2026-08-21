import SummaryCard from "./SummaryCard";
import {
    Package,
    CheckCircle2,
    Building2,
    HeartHandshake,
} from "lucide-react";

const stats = [
    {
        id: 1,
        title: "Active Food Donations",
        value: "08",
        subtitle: "Currently Active",
        trend: "+2",
        icon: <Package size={22} />,
        color: "emerald",
    },
   
    {
        id: 2,
        title: "Completed Donations",
        value: "24",
        subtitle: "Successfully Delivered",
        trend: "+5",
        icon: <CheckCircle2 size={22} />,
        color: "blue",
    },
    {
        id: 3,
        title: "NGOs Reached",
        value: "12",
        subtitle: "Partner NGOs",
        trend: "+1",
        icon: <Building2 size={22} />,
        color: "violet",
    },
    {
        id: 4,
        title: "Food Items Rescued",
        value: "420",
        subtitle: "Meals Saved",
        trend: "+36",
        icon: <HeartHandshake size={22} />,
        color: "orange",
    },
];

export default function StatsSection() {
    return (
        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 mt-6">
            {stats.map((item) => (
                <SummaryCard
                    key={item.id}
                    {...item}
                />
            ))}
        </section>
    );
}