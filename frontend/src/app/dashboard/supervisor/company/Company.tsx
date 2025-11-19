'use client';

import { Building2, MapPin, Globe, Phone, Mail, Users, Briefcase, Award, Calendar } from 'lucide-react';
import { SupervisorSidebar } from '@/components/supervisor/SupervisorSidebar';
import { SupervisorHeader } from '@/components/supervisor/SupervisorHeader';
import { MobileHeader } from '@/components/mobile/MobileHeader';
import { BottomNavigation } from '@/components/mobile/BottomNavigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';

export default function Company() {
  const companyInfo = {
    name: 'TechCorp Solutions',
    industry: 'Technology',
    size: '500-1000 employees',
    founded: '2010',
    headquarters: 'San Francisco, CA',
    website: 'www.techcorp.com',
    phone: '+1 (555) 123-4567',
    email: 'info@techcorp.com',
    description: 'Leading technology company specializing in software development, cloud computing, and AI solutions. We partner with universities to provide meaningful internship experiences for the next generation of tech professionals.'
  };

  const internshipProgram = {
    totalInterns: 15,
    activeInterns: 12,
    completedInterns: 45,
    departments: ['Engineering', 'Data Science', 'Product', 'Design'],
    benefits: [
      'Competitive stipend',
      'Mentorship program',
      'Professional development',
      'Networking opportunities',
      'Full-time conversion potential'
    ]
  };

  const stats = [
    { label: 'Active Interns', value: 12, icon: Users, color: 'text-success' },
    { label: 'Open Positions', value: 3, icon: Briefcase, color: 'text-primary' },
    { label: 'Completion Rate', value: '95%', icon: Award, color: 'text-purple-600' },
    { label: 'Program Years', value: 5, icon: Calendar, color: 'text-warning' }
  ];

  const openPositions = [
    {
      id: 1,
      title: 'Frontend Developer Intern',
      department: 'Engineering',
      duration: '3 months',
      requirements: ['React', 'TypeScript', 'CSS'],
      applicants: 8
    },
    {
      id: 2,
      title: 'Data Analyst Intern',
      department: 'Data Science',
      duration: '4 months',
      requirements: ['Python', 'SQL', 'Statistics'],
      applicants: 12
    },
    {
      id: 3,
      title: 'UX Design Intern',
      department: 'Design',
      duration: '3 months',
      requirements: ['Figma', 'User Research', 'Prototyping'],
      applicants: 6
    }
  ];

  return (
    <div className="h-screen bg-background overflow-hidden">
      {/* Desktop View */}
      <div className="hidden lg:flex h-full">
        {/* Left Sidebar */}
        <SupervisorSidebar />
        
        {/* Main Content */}
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          {/* Header */}
          <SupervisorHeader />
          
          {/* Page Content - Scrollable */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-6">
              {/* Page Header */}
              <div>
                <h1 className="text-3xl font-bold text-foreground">Company Profile</h1>
                <p className="text-muted-foreground mt-1">Manage your company information and internship program</p>
              </div>

              {/* Company Header */}
              <Card className="border-l-4 border-l-primary">
                <CardContent className="pt-6">
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex items-center justify-center w-24 h-24 bg-primary/10 rounded-lg flex-shrink-0">
                      <Building2 className="w-12 h-12 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-2xl font-bold text-foreground">{companyInfo.name}</h2>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <Badge variant="outline">{companyInfo.industry}</Badge>
                        <Badge variant="outline">{companyInfo.size}</Badge>
                        <Badge variant="outline">Founded {companyInfo.founded}</Badge>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          {companyInfo.headquarters}
                        </div>
                        <div className="flex items-center gap-2">
                          <Globe className="w-4 h-4" />
                          {companyInfo.website}
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4" />
                          {companyInfo.phone}
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4" />
                          {companyInfo.email}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button variant="outline">Edit Profile</Button>
                      <Button variant="outline">View Public Page</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {stats.map((stat) => {
                  const Icon = stat.icon;
                  return (
                    <Card key={stat.label}>
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                          <div className="p-3 bg-primary/10 rounded-lg">
                            <Icon className={`w-6 h-6 ${stat.color}`} />
                          </div>
                          <div>
                            <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                            <div className="text-sm text-muted-foreground">{stat.label}</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Tabs */}
              <Tabs defaultValue="overview" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="positions">Open Positions</TabsTrigger>
                  <TabsTrigger value="program">Internship Program</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>About {companyInfo.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground leading-relaxed">{companyInfo.description}</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Departments</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {internshipProgram.departments.map((dept) => (
                          <Badge key={dept} className="bg-primary/10 text-primary border-primary/20">
                            {dept}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="positions" className="space-y-4">
                  {openPositions.map((position) => (
                    <Card key={position.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-foreground">{position.title}</h3>
                            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                              <span>{position.department}</span>
                              <span>•</span>
                              <span>{position.duration}</span>
                              <span>•</span>
                              <span>{position.applicants} applicants</span>
                            </div>
                            <div className="flex flex-wrap gap-2 mt-3">
                              {position.requirements.map((req) => (
                                <Badge key={req} variant="outline">{req}</Badge>
                              ))}
                            </div>
                          </div>
                          <Button variant="outline">View Details</Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </TabsContent>

                <TabsContent value="program" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Internship Program Statistics</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center p-4 bg-primary/5 rounded-lg">
                          <div className="text-3xl font-bold text-primary">{internshipProgram.totalInterns}</div>
                          <div className="text-sm text-muted-foreground mt-1">Total Interns</div>
                        </div>
                        <div className="text-center p-4 bg-success/5 rounded-lg">
                          <div className="text-3xl font-bold text-success">{internshipProgram.activeInterns}</div>
                          <div className="text-sm text-muted-foreground mt-1">Active Interns</div>
                        </div>
                        <div className="text-center p-4 bg-primary/5 rounded-lg">
                          <div className="text-3xl font-bold text-primary">{internshipProgram.completedInterns}</div>
                          <div className="text-sm text-muted-foreground mt-1">Completed</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Program Benefits</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {internshipProgram.benefits.map((benefit, index) => (
                          <li key={index} className="flex items-center gap-2 text-foreground">
                            <div className="w-2 h-2 bg-primary rounded-full"></div>
                            {benefit}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile View */}
      <div className="lg:hidden h-screen flex flex-col overflow-hidden">
        {/* Mobile Header - Fixed */}
        <div className="flex-shrink-0">
          <MobileHeader 
            title="Company Profile"
            subtitle="TechCorp Solutions"
            logo={
              <div className="w-8 h-8 bg-gradient-hero rounded-lg flex items-center justify-center">
                <Building2 className="w-5 h-5 text-white" />
              </div>
            }
          />
        </div>

        {/* Mobile Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 pb-20 space-y-4">
          {/* Company Header - Mobile */}
          <Card className="border-l-4 border-l-primary">
            <CardContent className="p-4">
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-center w-16 h-16 bg-primary/10 rounded-lg mx-auto">
                  <Building2 className="w-8 h-8 text-primary" />
                </div>
                <div className="text-center">
                  <h2 className="text-xl font-bold text-foreground">{companyInfo.name}</h2>
                  <div className="flex flex-wrap gap-2 mt-2 justify-center">
                    <Badge variant="outline" className="text-xs">{companyInfo.industry}</Badge>
                    <Badge variant="outline" className="text-xs">{companyInfo.size}</Badge>
                  </div>
                </div>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    {companyInfo.headquarters}
                  </div>
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    {companyInfo.website}
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    {companyInfo.phone}
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    {companyInfo.email}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1">Edit</Button>
                  <Button variant="outline" size="sm" className="flex-1">View</Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats - Mobile */}
          <div className="grid grid-cols-2 gap-3">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <Card key={stat.label}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className={`w-5 h-5 ${stat.color}`} />
                    </div>
                    <div className="text-xl font-bold text-foreground">{stat.value}</div>
                    <div className="text-xs text-muted-foreground">{stat.label}</div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Tabs - Mobile */}
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="positions">Positions</TabsTrigger>
              <TabsTrigger value="program">Program</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">About {companyInfo.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed">{companyInfo.description}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Departments</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {internshipProgram.departments.map((dept) => (
                      <Badge key={dept} className="bg-primary/10 text-primary border-primary/20 text-xs">
                        {dept}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="positions" className="space-y-3">
              {openPositions.map((position) => (
                <Card key={position.id}>
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div>
                        <h3 className="font-semibold text-foreground">{position.title}</h3>
                        <div className="text-xs text-muted-foreground mt-1">
                          {position.department} • {position.duration} • {position.applicants} applicants
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {position.requirements.map((req) => (
                          <Badge key={req} variant="outline" className="text-xs">{req}</Badge>
                        ))}
                      </div>
                      <Button variant="outline" size="sm" className="w-full">View Details</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="program" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Program Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="text-center p-3 bg-primary/5 rounded-lg">
                      <div className="text-xl font-bold text-primary">{internshipProgram.totalInterns}</div>
                      <div className="text-xs text-muted-foreground mt-1">Total</div>
                    </div>
                    <div className="text-center p-3 bg-success/5 rounded-lg">
                      <div className="text-xl font-bold text-success">{internshipProgram.activeInterns}</div>
                      <div className="text-xs text-muted-foreground mt-1">Active</div>
                    </div>
                    <div className="text-center p-3 bg-primary/5 rounded-lg">
                      <div className="text-xl font-bold text-primary">{internshipProgram.completedInterns}</div>
                      <div className="text-xs text-muted-foreground mt-1">Completed</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Program Benefits</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {internshipProgram.benefits.map((benefit, index) => (
                      <li key={index} className="flex items-center gap-2 text-sm text-foreground">
                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Bottom Navigation - Fixed */}
        <div className="flex-shrink-0">
          <BottomNavigation type="supervisor" />
        </div>
      </div>
    </div>
  );
}

