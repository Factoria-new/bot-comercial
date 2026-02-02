import DemoAgentCreator from "@/components/DemoAgentCreator";


const YourExperiencePage = () => {
    return (
        <div className="relative min-h-screen bg-[#020617] text-white overflow-hidden">
            {/* Background Animation - Reusing RainbowBackground or similar if compatible, 
                 but DemoAgentCreator already has a background layer. 
                 Let's stick to a clean wrapper. 
             */}

            {/* 
                DemoAgentCreator is designed to be full screen.
                We just render it.
             */}
            <DemoAgentCreator />
        </div>
    );
};

export default YourExperiencePage;
