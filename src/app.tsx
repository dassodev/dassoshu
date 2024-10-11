'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@supabase/supabase-js'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import Image from 'next/image'
import { useTheme } from 'next-themes'
import { Slider } from "@/components/ui/slider"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { User, BookOpen, FileText, Pencil, Library, Plus, X, Settings, CreditCard, HelpCircle, Info, LogOut, Sun, Volume2, Palette, AlignLeft, AlignCenter, AlignRight, Minus, Type, ArrowLeft, Lock, Phone, MessageSquare, ChevronRight, Moon, Battery, Clock } from 'lucide-react'
import * as pdfjs from 'pdfjs-dist'
import { ErrorBoundary } from 'react-error-boundary'
import { useMediaQuery } from 'react-responsive'

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface BookType {
  id: string;
  title: string;
  type: string;
  content?: string;
  file?: File;
  coverImage?: string; // Make coverImage optional
}

interface UserProfile {
  name: string;
  email: string;
}

export default function DassoShu() {
  const [currentScreen, setCurrentScreen] = useState(0)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [currentTab, setCurrentTab] = useState('Home')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [books, setBooks] = useState<BookType[]>([])
  const [selectedBook, setSelectedBook] = useState<BookType | null>(null)
  const [authMessage, setAuthMessage] = useState('')
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
  const [fontSize, setFontSize] = useState(16)
  const [fontFamily, setFontFamily] = useState('font-sans')
  const [textAlign, setTextAlign] = useState('text-left')
  const [brightness, setBrightness] = useState(100)
  const [activeContainer, setActiveContainer] = useState<string | null>(null)
  const bottomBarRef = useRef<HTMLDivElement>(null)
  const [volume, setVolume] = useState(50)
  const [backgroundColor, setBackgroundColor] = useState('#f5f1e8')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [currentProfileScreen, setCurrentProfileScreen] = useState<string | null>(null)
  const [showSpaces, setShowSpaces] = useState(false)
  const [segmentedContent, setSegmentedContent] = useState('')
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)

  useEffect(() => {
    pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`
  }, [])

  useEffect(() => {
    if (showSpaces && selectedBook?.content) {
      segmentText(selectedBook.content)
    } else {
      setSegmentedContent(selectedBook?.content || '')
    }
  }, [showSpaces, selectedBook])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (bottomBarRef.current && !bottomBarRef.current.contains(event.target as Node)) {
        setActiveContainer(null)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data, error } = await supabase
          .from('profiles')
          .select('name, email')
          .eq('id', user.id)
          .single()

        if (error) {
          console.error('Error fetching user profile:', error)
          return
        }

        setUserProfile(data)
        setCurrentScreen(4) // Move to home screen
      }
    }

    checkUser()
  }, [])

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
  const files = event.target.files
  if (files) {
    const newBooks: BookType[] = []
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const id = Math.random().toString(36).substr(2, 9)
      const title = file.name.split('.').slice(0, -1).join('.')
      const type = file.name.split('.').pop() || ''

      let content = ''
      if (type === 'txt') {
        content = await file.text()
      }

      newBooks.push({
        id,
        title,
        type,
        content,
        file,
        // Don't set a default cover image here
      })
    }
    setBooks(prevBooks => [...prevBooks, ...newBooks])
  }
}, [])

  const openFileExplorer = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }, [])

  const removeBook = useCallback((id: string) => {
    setBooks(prevBooks => prevBooks.filter(book => book.id !== id))
    if (selectedBook?.id === id) {
      setSelectedBook(null)
    }
  }, [selectedBook])

  const selectBook = useCallback(async (book: BookType) => {
    if (book.type === 'pdf') {
      if (book.file) {
        const content = await readPdfContent(book.file)
        setSelectedBook({ ...book, content })
      } else if (book.content) {
        // If the book already has content, use that
        setSelectedBook(book)
      } else {
        // Handle the case where there's no file and no content
        console.error('PDF book has no file or content:', book.title)
        setSelectedBook({ ...book, content: 'Error: Unable to load PDF content.' })
      }
    } else {
      setSelectedBook(book)
    }
    setCurrentTab('Discover')
  }, [])

  const readPdfContent = async (file: File): Promise<string> => {
    try {
      const arrayBuffer = await file.arrayBuffer()
      const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise
      let content = ''
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i)
        const textContent = await page.getTextContent()
        content += textContent.items.map((item: any) => item.str).join(' ') + '\n\n'
      }
      return content
    } catch (error) {
      console.error('Error reading PDF content:', error)
      return 'Error: Unable to read PDF content.'
    }
  }

  const segmentText = async (text: string) => {
    try {
      const response = await fetch('/api/segment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      })
      if (!response.ok) {
        throw new Error('Segmentation failed')
      }
      const result = await response.json()
      setSegmentedContent(result.segmented.join(' '))
    } catch (error) {
      console.error('Error segmenting text:', error)
      setSegmentedContent('Error segmenting text')
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name,
          }
        }
      })
      if (error) throw error
      setAuthMessage('Registration successful. Please check your email for verification.')
      setCurrentScreen(3) // Move to verification screen
    } catch (error: any) {
      setAuthMessage(error.message)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('name, email')
        .eq('id', data.user.id)
        .single()
      if (profileError) {
        console.error('Error fetching user profile:', profileError)
        setAuthMessage('Login successful, but there was an error fetching your profile.')
        return
      }
      setUserProfile(profileData)
      setAuthMessage('Login successful')
      setCurrentScreen(4) // Move to home screen
    } catch (error: any) {
      setAuthMessage(error.message)
    }
  }

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      setAuthMessage('Logout successful')
      setCurrentScreen(0) // Move to welcome screen
      setIsProfileMenuOpen(false) // Close the profile menu
      setCurrentProfileScreen(null) // Reset the profile screen
      setUserProfile(null) // Clear user profile
    } catch (error: any) {
      setAuthMessage(error.message)
    }
  }

  const updateProfile = async (updatedProfile: UserProfile) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No user logged in')

      const { error } = await supabase
        .from('profiles')
        .update(updatedProfile)
        .eq('id', user.id)

      if (error) throw error

      setUserProfile(updatedProfile)
      setAuthMessage('Profile updated successfully')
    } catch (error: any) {
      setAuthMessage(error.message)
    }
  }

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(!isFullscreen)
  }, [isFullscreen])

  const toggleDarkMode = useCallback(() => {
    setIsDarkMode(!isDarkMode)
  }, [isDarkMode])

 const Bookshelf = () => {
  const shelves = [
  { id: 1, books: books.slice(0, 5) },
  { id: 2, books: books.slice(5, 10) },
  { id: 3, books: books.slice(10, 15) },
  { id: 4, books: books.slice(15, 20) }
]

  return (
    <div className="h-full relative overflow-hidden">
      <div
        className="absolute inset-0 z-0 bg-repeat-y"
        style={{
          backgroundImage: 'url("/bookshelf-background.webp")',
          backgroundSize: '100% 25%', // 1/4 of the height, for 4 shelves
        }}
      />
      <div className="relative z-10 h-full p-4 flex flex-col">
        {shelves.map((shelf) => (
          <div key={shelf.id} className="flex-1 flex items-end mb-4">
            <div className="w-full flex justify-start items-end space-x-2">
              {shelf.books.map((book) => (
                <div key={book.id} className="w-1/5 h-[85%] px-1 relative">
  <div
    className="w-full h-full flex flex-col items-center justify-end cursor-pointer transition-all duration-300 hover:scale-105"
    onClick={() => selectBook(book)}
  >
    <div className="w-full h-[150%] relative overflow-hidden book-shape rounded-sm">
      {book.coverImage ? (
        <Image
          src={`/book-covers/${book.coverImage}`}
          alt={book.title}
          layout="fill"
          objectFit="cover"
          className="rounded-sm"
        />
      ) : (
        <div className={`w-full h-full flex items-center justify-center bg-gray-200 rounded-sm ${isDarkMode ? 'text-gray-600' : 'text-gray-800'}`}>
          <BookOpen className="w-16 h-16" />
        </div>
      )}
    </div>
    <div className="w-full mt-2 overflow-hidden">
      <p className={`text-xs text-center ${
        isDarkMode ? 'text-gray-300' : 'text-gray-700'
      } font-medium line-clamp-2`}>
        {book.title}
      </p>
    </div>
  </div>
  <Button
    variant="ghost"
    size="icon"
    className={`absolute top-0 right-0 ${
      isDarkMode ? 'text-gray-400 hover:text-red-400' : 'text-gray-600 hover:text-red-500'
    }`}
    onClick={(e) => {
      e.stopPropagation()
      removeBook(book.id)
    }}
  >
    <X className="h-3 w-3" />
  </Button>
</div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <Button
        variant="ghost"
        size="icon"
        className={`absolute bottom-4 right-4 z-20 ${
          isDarkMode ? 'bg-gray-800 text-white hover:bg-gray-700' : 'bg-primary text-white hover:bg-primary/90'
        } rounded-full p-2`}
        onClick={openFileExplorer}
      >
        <Plus className="h-6 w-6" />
      </Button>
    </div>
  )
}

  const BookReader = ({ book }: { book: BookType }) => {
    const content = showSpaces ? segmentedContent : (book.content || '')
    const [currentPage, setCurrentPage] = useState(1)
    const totalPages = Math.ceil(content.split('\n').length / 20) // Assuming 20 paragraphs per page

    useEffect(() => {
      const handleScroll = (e: Event) => {
        const target = e.target as HTMLDivElement
        const scrollPercentage = target.scrollTop / (target.scrollHeight - target.clientHeight)
        setCurrentPage(Math.ceil(scrollPercentage * totalPages))
      }

      const contentDiv = document.getElementById('book-content')
      if (contentDiv) {
        contentDiv.addEventListener('scroll', handleScroll)
      }

      return () => {
        if (contentDiv) {
          contentDiv.removeEventListener('scroll', handleScroll)
        }
      }
    }, [totalPages])

    return (
      <div
        className={`relative h-full transition-all duration-300 ease-in-out ${
          isFullscreen ? 'fixed inset-0 z-50' : 'p-4'
        } ${fontFamily} ${textAlign} overflow-hidden`}
        style={{
          filter: `brightness(${brightness}%)`,
          backgroundColor: isDarkMode ? '#1a1a1a' : backgroundColor,
          color: isDarkMode ? '#e0e0e0' : 'inherit',
        }}
        onDoubleClick={toggleFullscreen}
      >
        <div id="book-content" className="h-full overflow-y-auto px-4 md:px-8 lg:px-16 pb-16">
          <h2 className={`text-2xl font-bold mb-6 ${isDarkMode ? 'text-gray-200' : 'text-primary'}`}>{book.title}</h2>
          <div className="prose prose-sm max-w-none">
            {content.split('\n').map((paragraph, index) => (
              <p key={index} className={`mb-4 text-lg leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`} style={{ fontSize: `${fontSize}px` }}>
                {paragraph}
              </p>
            ))}
          </div>
        </div>
        {isFullscreen && (
          <>
            <button
              className="absolute top-4 right-4 p-2 bg-black bg-opacity-50 text-white rounded-full transition-opacity duration-300 opacity-0 hover:opacity-100"
              onClick={toggleFullscreen}
            >
              <X className="h-6 w-6" />
            </button>
            <Footer
              currentPage={currentPage}
              totalPages={totalPages}
              isDarkMode={isDarkMode}
              backgroundColor={backgroundColor}
            />
          </>
        )}
      </div>
    )
  }

  const Footer = ({
    currentPage,
    totalPages,
    isDarkMode,
    backgroundColor
  }: {
    currentPage: number;
    totalPages: number;
    isDarkMode: boolean;
    backgroundColor: string;
  }) => {
    const [currentTime, setCurrentTime] = useState(new Date())
    const [batteryLevel, setBatteryLevel] = useState<number | null>(null)

    useEffect(() => {
      const timer = setInterval(() => setCurrentTime(new Date()), 1000)

      const updateBattery = async () => {
        if ('getBattery' in navigator) {
          try {
            const battery = await (navigator as any).getBattery()
            setBatteryLevel(Math.round(battery.level * 100))

            // Listen for battery level changes
            battery.addEventListener('levelchange', () => {
              setBatteryLevel(Math.round(battery.level * 100))
            })
          } catch (error) {
            console.error('Error accessing battery status:', error)
            setBatteryLevel(null)
          }
        } else {
          console.log('Battery Status API not supported')
          setBatteryLevel(null)
        }
      }

      updateBattery()

      return () => clearInterval(timer)
    }, [])

    return (
      <div
        className="absolute bottom-0 left-0 right-0 p-2 flex justify-between items-center text-xs"
        style={{
          backgroundColor: isDarkMode ? '#1a1a1a' : backgroundColor,
          color: isDarkMode ? '#9ca3af' : '#4b5563',
          borderTop: `1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`
        }}
      >
        <div className="flex items-center space-x-2">
          <span>{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          {batteryLevel !== null && (
            <div className="flex items-center space-x-1">
              <Battery className="h-3 w-3" />
              <span>{batteryLevel}%</span>
            </div>
          )}
        </div>
        <div>
          {currentPage}/{totalPages}
        </div>
      </div>
    )
  }

  const BottomBar = () => {
    return (
      <div ref={bottomBarRef} className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-t p-4`}>
        <div className="flex justify-around items-center">
          <BottomBarButton icon={<Type className="h-6 w-6" />} onClick={() => setActiveContainer(activeContainer === 'font' ? null : 'font')} isActive={activeContainer === 'font'} />
          <BottomBarButton icon={<Sun className="h-6 w-6" />} onClick={() => setActiveContainer(activeContainer === 'brightness' ? null : 'brightness')} isActive={activeContainer === 'brightness'} />
          <BottomBarButton icon={<BookOpen className="h-6 w-6" />} onClick={() => setActiveContainer(activeContainer === 'book' ? null : 'book')} isActive={activeContainer === 'book'} />
          <BottomBarButton icon={<Volume2 className="h-6 w-6" />} onClick={() => setActiveContainer(activeContainer === 'audio' ? null : 'audio')} isActive={activeContainer === 'audio'} />
          <BottomBarButton icon={<Palette className="h-6 w-6" />} onClick={() => setActiveContainer(activeContainer === 'background' ? null : 'background')} isActive={activeContainer === 'background'} />
        </div>
        {activeContainer === 'font' &&
          <FontSettings
            fontSize={fontSize}
            setFontSize={setFontSize}
            textAlign={textAlign}
            setTextAlign={setTextAlign}
            showSpaces={showSpaces}
            setShowSpaces={setShowSpaces}
            isDarkMode={isDarkMode}
          />
        }
        {activeContainer === 'brightness' && <BrightnessContainer brightness={brightness} setBrightness={setBrightness} isDarkMode={isDarkMode} />}
        {activeContainer === 'book' && <BookContainer books={books} selectBook={selectBook} selectedBook={selectedBook} isDarkMode={isDarkMode} />}
        {activeContainer === 'audio' && <AudioContainer volume={volume} setVolume={setVolume} isDarkMode={isDarkMode} />}
        {activeContainer === 'background' && <BackgroundContainer setBackgroundColor={setBackgroundColor} isDarkMode={isDarkMode} />}
      </div>
    )
  }

  const BottomBarButton = ({ icon, onClick, isActive }: { icon: React.ReactNode; onClick: () => void; isActive: boolean }) => {
    return (
      <Button
        variant="ghost"
        size="icon"
        className={`rounded-full ${isActive ? (isDarkMode ? 'bg-gray-700' : 'bg-primary/20') : ''}`}
        onClick={onClick}
      >
        {icon}
      </Button>
    )
  }

  const FontSettings = ({ fontSize, setFontSize, textAlign, setTextAlign, showSpaces, setShowSpaces, isDarkMode }: any) => {
    return (
      <div className={`p-4 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg space-y-4`}>
        <div className="flex items-center justify-between">
          <span className={`text-xs font-bold ${isDarkMode ? 'text-gray-400' : 'text-primary'}`}>A</span>
          <div className="flex items-center space-x-2 flex-grow mx-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFontSize(Math.max(12, fontSize - 1))}
              className={`${isDarkMode ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700' : 'text-primary hover:text-primary-dark hover:bg-primary/20'} p-1`}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <div className="relative flex-grow h-8">
              <div
                className={`absolute inset-0 ${isDarkMode ? 'bg-gray-600' : 'bg-primary/40'} rounded-full`}
                style={{ height: '0.5px', top: 'calc(50% - 0.25px)' }}
              ></div>
              <Slider
                min={12}
                max={32}
                step={1}
                value={[fontSize]}
                onValueChange={(value) => setFontSize(value[0])}
                className="absolute inset-0"
              />
              <div
                className={`absolute top-1/2 transform -translate-y-1/2 ${isDarkMode ? 'bg-gray-200 text-gray-800' : 'bg-primary text-white'} px-2 py-0.5 rounded-full text-xs font-bold`}
                style={{ left: `calc(${(fontSize - 12) / 20 * 100}% - 10px)` }}
              >
                {fontSize}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFontSize(Math.min(32, fontSize + 1))}
              className={`${isDarkMode ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700' : 'text-primary hover:text-primary-dark hover:bg-primary/20'} p-1`}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <span className={`text-lg font-bold ${isDarkMode ? 'text-gray-400' : 'text-primary'}`}>A</span>
        </div>
        <div className="flex justify-center">
          <div className="inline-flex rounded-md shadow-sm" role="group">
            {['text-left', 'text-center', 'text-right'].map((align) => (
              <Button
                key={align}
                variant="ghost"
                size="sm"
                onClick={() => setTextAlign(align)}
                className={`px-3 py-2 ${
                  textAlign === align
                    ? isDarkMode ? 'bg-gray-700 text-gray-200' : 'bg-primary/20 text-primary'
                    : isDarkMode ? 'text-gray-400' : 'text-primary'
                }`}
              >
                {align === 'text-left' && <AlignLeft className="h-4 w-4" />}
                {align === 'text-center' && <AlignCenter className="h-4 w-4" />}
                {align === 'text-right' && <AlignRight className="h-4 w-4" />}
              </Button>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-primary'}`}>Asian script settings Show spaces between words</span>
          <Switch
            checked={showSpaces}
            onCheckedChange={setShowSpaces}
          />
        </div>
      </div>
    )
  }

  const BrightnessContainer = ({ brightness, setBrightness, isDarkMode }: any) => {
    return (
      <div className={`p-4 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="flex items-center justify-between">
          <Sun className={`h-4 w-4 ${isDarkMode ? 'text-gray-400' : 'text-primary'}`} />
          <Slider
            id="brightness"
            min={50}
            max={150}
            step={1}
            value={[brightness]}
            onValueChange={(value) => setBrightness(value[0])}
            className="w-48"
          />
          <Sun className={`h-6 w-6 ${isDarkMode ? 'text-gray-400' : 'text-primary'}`} />
        </div>
      </div>
    )
  }

  const BookContainer = ({ books, selectBook, selectedBook, isDarkMode }: any) => {
    return (
      <div className={`p-4 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <Select onValueChange={(value) => selectBook(books.find(book => book.id === value) || books[0])} defaultValue={selectedBook?.id}>
          <SelectTrigger className={`w-full ${isDarkMode ? 'bg-gray-700 text-gray-200' : 'bg-white text-primary'}`}>
            <SelectValue placeholder="Select a book" />
          </SelectTrigger>
          <SelectContent>
            {books.map((book: BookType) => (
              <SelectItem key={book.id} value={book.id}>{book.title}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    )
  }

  const AudioContainer = ({ volume, setVolume, isDarkMode }: any) => {
    return (
      <div className={`p-4 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="flex items-center justify-between">
          <Volume2 className={`h-4 w-4 ${isDarkMode ? 'text-gray-400' : 'text-primary'}`} />
          <Slider
            id="volume"
            min={0}
            max={100}
            step={1}
            value={[volume]}
            onValueChange={(value) => setVolume(value[0])}
            className="w-48"
          />
          <Volume2 className={`h-6 w-6 ${isDarkMode ? 'text-gray-400' : 'text-primary'}`} />
        </div>
      </div>
    )
  }

  const BackgroundContainer = ({ setBackgroundColor, isDarkMode }: any) => {
    const colors = ['#ffffff', '#e8f5f1', '#f1e8f5', '#f5e8f1', '#f1f5e8']
    return (
      <div className={`p-4 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="flex justify-around">
          {colors.map((color) => (
            <Button
              key={color}
              className={`w-8 h-8 rounded-full border-2 ${isDarkMode ? 'border-gray-600' : 'border-primary/20'}`}
              style={{ backgroundColor: color }}
              onClick={() => setBackgroundColor(color)}
            />
          ))}
        </div>
      </div>
    )
  }

  const TabContent = () => {
  switch(currentTab) {
    case 'Home':
      return (
        <div className="h-full">
          <Bookshelf />
        </div>
      )
    case 'Discover':
      return (
        <div className={`h-full flex flex-col ${isFullscreen ? 'absolute inset-0 z-10 bg-white' : ''}`}>
          {selectedBook ? (
            <>
              <div className={`flex-grow overflow-y-auto ${isFullscreen ? 'h-full' : ''}`}>
                <BookReader book={selectedBook} />
              </div>
              {!isFullscreen && (
                <div className="mt-auto">
                  <BottomBar />
                </div>
              )}
            </>
          ) : (
            <div className={`text-center ${isDarkMode ? 'text-gray-300' : 'text-primary'}`}>
              Select a book to read
            </div>
          )}
        </div>
      )
    case 'Font':
      return <div className={`text-center ${isDarkMode ? 'text-gray-300' : 'text-primary'}`}>Font Content</div>
    case 'Flashcards':
      return <div className={`text-center ${isDarkMode ? 'text-gray-300' : 'text-primary'}`}>Flashcards Content</div>
    default:
      return <div className={`text-center ${isDarkMode ? 'text-gray-300' : 'text-primary'}`}>Select a tab</div>
  }
}

  const ProfileMenu = () => (
    <div className={`absolute inset-0 ${isDarkMode ? 'bg-gray-900' : 'bg-white'} z-50 overflow-y-auto`}>
      <div className="max-w-md mx-auto p-6 space-y-6">
        <div className="flex items-center">
          <Button
            variant="ghost"
            onClick={() => setIsProfileMenuOpen(false)}
            className={`p-2 ${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'} rounded-full`}
          >
            <ArrowLeft className={`h-6 w-6 ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`} />
          </Button>
          <h1 className={`text-2xl font-bold ml-4 ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>Back</h1>
        </div>

        <div className="flex items-center space-x-4">
          <div className={`w-16 h-16 rounded-full ${isDarkMode ? 'bg-gray-800' : 'bg-gray-200'} flex items-center justify-center`}>
            <User className={`h-8 w-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
          </div>
          <div>
            <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>{userProfile?.name || 'Name'}</h2>
            <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{userProfile?.email || 'dasso.cn@gmail.com'}</p>
          </div>
        </div>

        <div className="space-y-4">
          {[
            { label: 'User Account', screen: 'UserAccount', icon: User },
            { label: 'Subscription', screen: 'Subscription', icon: CreditCard },
            { label: 'Settings', screen: 'Settings', icon: Settings },
            { label: 'Contact Us', screen: 'ContactUs', icon: MessageSquare },
            { label: 'About Us', screen: 'AboutUs', icon: Info },
          ].map((item, index, array) => (
            <div key={item.screen}>
              <Button
                variant="ghost"
                className={`w-full justify-between text-lg py-3 px-0 ${
                  isDarkMode
                    ? 'text-gray-300 hover:bg-gray-800'
                    : 'text-gray-900 hover:bg-gray-50'
                }`}
                onClick={() => {
                  setCurrentProfileScreen(item.screen)
                }}
              >
                <span className="flex items-center">
                  <item.icon className={`h-5 w-5 mr-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                  {item.label}
                </span>
                <ChevronRight className={`h-5 w-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-400'}`} />
              </Button>
              {index < array.length - 1 && <div className={`h-px ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} w-full mt-1`} />}
            </div>
          ))}

          <div className={`h-px ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} w-full`} />
          <Button
            variant="ghost"
            className={`w-full justify-between text-lg py-3 px-0 ${
              isDarkMode
                ? 'text-red-400 hover:bg-gray-800'
                : 'text-red-500 hover:bg-gray-50'
            }`}
            onClick={handleLogout}
          >
            <span className="flex items-center">
              <LogOut className="h-5 w-5 mr-3 text-current" />
              Logout
            </span>
          </Button>
        </div>
      </div>
    </div>
  )

  const UserAccountScreen = () => {
    const [updatedName, setUpdatedName] = useState(userProfile?.name || '')
    const [updatedEmail, setUpdatedEmail] = useState(userProfile?.email || '')

    const handleUpdateProfile = async (e: React.FormEvent) => {
      e.preventDefault()
      await updateProfile({ name: updatedName, email: updatedEmail })
    }

    return (
      <div className={`absolute inset-0 ${isDarkMode ? 'bg-gray-900' : 'bg-white'} z-50 overflow-y-auto`}>
        <div className="p-6">
          <Button variant="ghost" onClick={() => setCurrentProfileScreen(null)} className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          <div className="max-w-2xl mx-auto space-y-6">
            <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-gray-200' : 'text-primary'} mb-6`}>User Account</h1>
            <Card className={isDarkMode ? 'bg-gray-800 text-gray-200' : 'bg-white text-primary'}>
              <CardHeader>
                <CardTitle className="text-xl font-semibold flex items-center">
                  <User className="mr-2 h-5 w-5" /> Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <form onSubmit={handleUpdateProfile}>
                  <div>
                    <Label htmlFor="name" className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-primary'}`}>Name</Label>
                    <Input
                      id="name"
                      value={updatedName}
                      onChange={(e) => setUpdatedName(e.target.value)}
                      className={`mt-1 ${isDarkMode ? 'bg-gray-700 text-gray-200' : 'bg-white text-primary'}`}
                    />
                  </div>
                  <div className="mt-4">
                    <Label htmlFor="email" className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' :  'text-primary'}`}>Email</Label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className={`h-5 w-5 ${isDarkMode ? 'text-gray-500' : 'text-primary/60'}`} />
                      </div>
                      <Input
                        id="email"
                        type="email"
                        value={updatedEmail}
                        onChange={(e) => setUpdatedEmail(e.target.value)}
                        className={`pl-10 ${isDarkMode ? 'bg-gray-700 text-gray-200' : 'bg-white text-primary'}`}
                      />
                    </div>
                  </div>
                  <Button type="submit" className="mt-4 w-full">Update Profile</Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  const SubscriptionScreen = () => (
    <div className={`absolute inset-0 ${isDarkMode ? 'bg-gray-900' : 'bg-white'} z-50 overflow-y-auto`}>
      <div className="p-6">
        <Button variant="ghost" onClick={() => setCurrentProfileScreen(null)} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <div className="max-w-2xl mx-auto space-y-6">
          <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-gray-200' : 'text-primary'} mb-6`}>Subscription</h1>
          <Card className={isDarkMode ? 'bg-gray-800 text-gray-200' : 'bg-white text-primary'}>
            <CardHeader>
              <CardTitle className="text-xl font-semibold flex items-center">
                <CreditCard className="mr-2 h-5 w-5" /> Current Plan
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="font-medium">Free Plan</span>
                <Badge variant={isDarkMode ? 'outline' : 'default'}>Active</Badge>
              </div>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-primary/60'}`}>Enjoy basic features with our free plan.</p>
              <Button className="w-full">Upgrade to Premium</Button>
            </CardContent>
          </Card>
          <Card className={isDarkMode ? 'bg-gray-800 text-gray-200' : 'bg-white text-primary'}>
            <CardHeader>
              <CardTitle className="text-xl font-semibold flex items-center">
                <CreditCard className="mr-2 h-5 w-5" /> Premium Features
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className={`list-disc list-inside text-sm ${isDarkMode ? 'text-gray-400' : 'text-primary/60'}`}>
                <li>Unlimited book uploads</li>
                <li>Advanced customization options</li>
                <li>Ad-free experience</li>
                <li>Priority customer support</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )

  const SettingsScreen = () => (
    <div className={`absolute inset-0 ${isDarkMode ? 'bg-gray-900' : 'bg-white'} z-50 overflow-y-auto`}>
      <div className="p-6">
        <Button variant="ghost" onClick={() => setCurrentProfileScreen(null)} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <div className="max-w-2xl mx-auto space-y-6">
          <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-gray-200' : 'text-primary'} mb-6`}>Settings</h1>
          <Card className={isDarkMode ? 'bg-gray-800 text-gray-200' : 'bg-white text-primary'}>
            <CardHeader>
              <CardTitle className="text-xl font-semibold flex items-center">
                <Settings className="mr-2 h-5 w-5" /> General Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-primary'}`}>Dark Mode</span>
                <Switch id="dark-mode" checked={isDarkMode} onCheckedChange={toggleDarkMode} />
              </div>
              <div className="flex items-center justify-between">
                <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-primary'}`}>Notifications</span>
                <Switch id="notifications" />
              </div>
              <div>
                <Label htmlFor="language" className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-primary'}`}>Language</Label>
                <Select>
                  <SelectTrigger id="language" className={isDarkMode ? 'bg-gray-700 text-gray-200' : 'bg-white text-primary'}>
                    <SelectValue placeholder="Select a language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Español</SelectItem>
                    <SelectItem value="fr">Français</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
          <Card className={isDarkMode ? 'bg-gray-800 text-gray-200' : 'bg-white text-primary'}>
            <CardHeader>
              <CardTitle className="text-xl font-semibold flex items-center">
                <BookOpen className="mr-2 h-5 w-5" /> Reading Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="font-size" className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-primary'}`}>Default Font Size</Label>
                <Select>
                  <SelectTrigger id="font-size" className={isDarkMode ? 'bg-gray-700 text-gray-200' : 'bg-white text-primary'}>
                    <SelectValue placeholder="Select a font size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">Small</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="large">Large</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="theme" className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-primary'}`}>Reading Theme</Label>
                <Select>
                  <SelectTrigger id="theme" className={isDarkMode ? 'bg-gray-700 text-gray-200' : 'bg-white text-primary'}>
                    <SelectValue placeholder="Select a theme" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="sepia">Sepia</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
          <div className="flex justify-end">
            <Button className="w-full sm:w-auto">Save Settings</Button>
          </div>
        </div>
      </div>
    </div>
  )

  const ContactUsScreen = () => (
    <div className={`absolute inset-0 ${isDarkMode ? 'bg-gray-900' : 'bg-white'} z-50 overflow-y-auto`}>
      <div className="p-6">
        <Button variant="ghost" onClick={() => setCurrentProfileScreen(null)} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <div className="max-w-2xl mx-auto space-y-6">
          <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-gray-200' : 'text-primary'} mb-6`}>Contact Us</h1>
          <Card className={isDarkMode ? 'bg-gray-800 text-gray-200' : 'bg-white text-primary'}>
            <CardHeader>
              <CardTitle className="text-xl font-semibold flex items-center">
                <MessageSquare className="mr-2 h-5 w-5" /> Send us a message
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name" className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-primary'}`}>Name</Label>
                <Input id="name" placeholder="Your Name" className={`mt-1 ${isDarkMode ? 'bg-gray-700 text-gray-200' : 'bg-white text-primary'}`} />
              </div>
              <div>
                <Label htmlFor="email" className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-primary'}`}>Email</Label>
                <Input id="email" type="email" placeholder="your.email@example.com" className={`mt-1 ${isDarkMode ? 'bg-gray-700 text-gray-200' : 'bg-white text-primary'}`} />
              </div>
              <div>
                <Label htmlFor="message" className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-primary'}`}>Message</Label>
                <textarea
                  id="message"
                  rows={4}
                  className={`mt-1 block w-full rounded-md ${isDarkMode ? 'bg-gray-700 text-gray-200 border-gray-600' : 'bg-white text-primary border-primary/20'} shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50`}
                  placeholder="Your message here..."
                ></textarea>
              </div>
              <Button className="w-full">Send Message</Button>
            </CardContent>
          </Card>
          <Card className={isDarkMode ? 'bg-gray-800 text-gray-200' : 'bg-white text-primary'}>
            <CardHeader>
              <CardTitle className="text-xl font-semibold flex items-center">
                <Phone className="mr-2 h-5 w-5" /> Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-primary/60'}`}>
                <strong>Email:</strong> support@dassoshu.com
              </p>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-primary/60'}`}>
                <strong>Phone:</strong> +1 (555) 123-4567
              </p>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-primary/60'}`}>
                <strong>Address:</strong> 123 Book Street, Reading City, 12345
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )

  const AboutUsScreen = () => (
    <div className={`absolute inset-0 ${isDarkMode ? 'bg-gray-900' : 'bg-white'} z-50 overflow-y-auto`}>
      <div className="p-6">
        <Button variant="ghost" onClick={() => setCurrentProfileScreen(null)} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <div className="max-w-2xl mx-auto space-y-6">
          <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-gray-200' : 'text-primary'} mb-6`}>About Us</h1>
          <Card className={isDarkMode ? 'bg-gray-800 text-gray-200' : 'bg-white text-primary'}>
            <CardHeader>
              <CardTitle className="text-xl font-semibold flex items-center">
                <Info className="mr-2 h-5 w-5" /> Our Story
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-primary/60'}`}>
                DassoShu was founded in 2023 with a mission to revolutionize the digital reading experience. Our team of book lovers and tech enthusiasts came together to create a platform that combines the joy of reading with the convenience of modern technology.
              </p>
            </CardContent>
          </Card>
          <Card className={isDarkMode ? 'bg-gray-800 text-gray-200' : 'bg-white text-primary'}>
            <CardHeader>
              <CardTitle className="text-xl font-semibold flex items-center">
                <BookOpen className="mr-2 h-5 w-5" /> Our Mission
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-primary/60'}`}>
                We aim to make reading more accessible, enjoyable, and interactive for everyone. By leveraging cutting-edge technology, we're creating a community of readers who can explore, share, and discuss their favorite books like never before.
              </p>
            </CardContent>
          </Card>
          <Card className={isDarkMode ? 'bg-gray-800 text-gray-200' : 'bg-white text-primary'}>
            <CardHeader>
              <CardTitle className="text-xl font-semibold flex items-center">
                <User className="mr-2 h-5 w-5" /> Our Team
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-primary/60'}`}>
                Our diverse team brings together expertise from various fields including software development, UX design, and literature. We're united by our passion for books and our commitment to creating the best possible reading experience for our users.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )

  const Header = () => {
    const isMobile = useMediaQuery({ maxWidth: 640 })

    return (
      <div className={isDarkMode ? 'bg-gray-900 text-white' : 'bg-primary text-white'}>
        <div className="flex justify-between items-center px-4 py-3">
          <Button
            variant="ghost"
            size="icon"
            className={`rounded-full ${isDarkMode ? 'bg-gray-800 text-gray-200' : 'bg-white text-primary'} w-10 h-10 flex items-center justify-center`}
            onClick={() => setIsProfileMenuOpen(true)}
          >
            <User className="h-5 w-5" />
          </Button>
          <h1 className={`font-bold ${isMobile ? 'text-xl' : 'text-3xl'}`}>DassoShu</h1>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full bg-transparent w-10 h-10 flex items-center justify-center"
            onClick={toggleDarkMode}
          >
            {isDarkMode ? (
              <Moon className="h-5 w-5 text-white fill-white" />
            ) : (
              <Sun className="h-5 w-5 text-white fill-white" />
            )}
          </Button>
        </div>
        <div className="flex justify-around items-center py-2">
          <NavItem icon={<Library className="h-7 w-7" />} label="Bookshelf" isActive={currentTab === 'Home'} onClick={() => setCurrentTab('Home')} />
          <NavItem icon={<BookOpen className="h-7 w-7" />} label="Reading" isActive={currentTab === 'Discover'} onClick={() => setCurrentTab('Discover')} />
          <NavItem icon={<Pencil className="h-7 w-7" />} label="Note" isActive={currentTab === 'Font'} onClick={() => setCurrentTab('Font')} />
          <NavItem icon={<FileText className="h-7 w-7" />} label="Flashcards" isActive={currentTab === 'Flashcards'} onClick={() => setCurrentTab('Flashcards')} />
        </div>
      </div>
    )
  }

  const screens = [
    // Welcome Screen
    <div key="welcome" className={`flex flex-col items-center justify-between h-full p-6 text-center ${isDarkMode ? 'bg-gray-900 text-gray-200' : 'bg-white text-black'}`}>
      <div className="text-sm">2023</div>
      <div>
        <img src="/placeholder.svg?height=200&width=200" alt="AI Robot" className="mx-auto mb-6" />
        <h1 className="text-4xl font-bold mb-2">Boost your productivity</h1>
        <p className={`${isDarkMode ? 'text-gray-400' : 'text-muted-foreground'} mb-6`}>Chat with the smartest AI - Experience the power of AI with us.</p>
        <div className="flex justify-center space-x-2 mb-6">
          <div className="w-2 h-2 rounded-full bg-primary"></div>
          <div className={`w-2 h-2 rounded-full ${isDarkMode ? 'bg-gray-700' : 'bg-gray-300'}`}></div>
          <div className={`w-2 h-2 rounded-full ${isDarkMode ? 'bg-gray-700' : 'bg-gray-300'}`}></div>
        </div>
      </div>
      <div className="w-full space-y-4">
        <Button className="w-full" onClick={() => setCurrentScreen(1)}>Login</Button>
        <Button variant="outline" className="w-full" onClick={() => setCurrentScreen(2)}>Create an account</Button>
      </div>
    </div>,

    // Login Screen
    <div key="login" className={`p-6 space-y-6 ${isDarkMode ? 'bg-gray-900 text-gray-200' : 'bg-white text-black'}`}>
      <Button variant="ghost" className="p-0" onClick={() => setCurrentScreen(0)}>Back</Button>
      <div>
        <h2 className="text-2xl font-bold mb-2">Login</h2>
        <p className={isDarkMode ? 'text-gray-400' : 'text-muted-foreground'}>Fill in the blanks below to sign into your account.</p>
      </div>
      <form onSubmit={handleLogin} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" placeholder="ex: johndoe@gmail.com" onChange={(e) => setEmail(e.target.value)} className={isDarkMode ? 'bg-gray-800 text-gray-200' : ''} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" placeholder="ex: ••••••••" onChange={(e) => setPassword(e.target.value)} className={isDarkMode ? 'bg-gray-800 text-gray-200' : ''} />
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Checkbox id="remember" />
            <label htmlFor="remember" className="text-sm">Remember Me</label>
          </div>
          <Button variant="link" className="p-0">Forgot Password?</Button>
        </div>
        <Button type="submit" className="w-full">Login</Button>
      </form>
      {authMessage && <p className="text-center text-sm">{authMessage}</p>}
      <div className="text-center">
        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-muted-foreground'} mb-4`}>or continue with</p>
        <div className="flex justify-center space-x-4">
          <Button variant="outline" size="icon"><User className="h-4 w-4" /></Button>
          <Button variant="outline" size="icon"><User className="h-4 w-4" /></Button>
          <Button variant="outline" size="icon"><User className="h-4 w-4" /></Button>
        </div>
      </div>
      <div className="text-center">
        <Button variant="link" onClick={() => setCurrentScreen(2)}>Don't have an account? Sign up</Button>
      </div>
    </div>,

    // Sign Up Screen
    <div key="signup" className={`p-6 space-y-6 ${isDarkMode ? 'bg-gray-900 text-gray-200' : 'bg-white text-black'}`}>
      <Button variant="ghost" className="p-0" onClick={() => setCurrentScreen(0)}>Back</Button>
      <div>
        <h2 className="text-2xl font-bold mb-2">Sign up</h2>
        <p className={isDarkMode ? 'text-gray-400' : 'text-muted-foreground'}>Fill in the blanks below to create an account.</p>
      </div>
      <form onSubmit={handleRegister} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input id="name" placeholder="ex: John Doe" onChange={(e) => setName(e.target.value)} className={isDarkMode ? 'bg-gray-800 text-gray-200' : ''} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" placeholder="ex: johndoe@gmail.com" onChange={(e) => setEmail(e.target.value)} className={isDarkMode ? 'bg-gray-800 text-gray-200' : ''} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" placeholder="ex: ••••••••" onChange={(e) => setPassword(e.target.value)} className={isDarkMode ? 'bg-gray-800 text-gray-200' : ''} />
        </div>
        <p className={`text-sm ${isDarkMode ? 'text-gray-400'
 : 'text-muted-foreground'}`}>
          By signing up you agree to our <Button variant="link" className="p-0">terms & conditions</Button> and <Button variant="link" className="p-0">privacy policy</Button>.
        </p>
        <Button type="submit" className="w-full">Continue</Button>
      </form>
      {authMessage && <p className="text-center text-sm">{authMessage}</p>}
      <div className="text-center">
        <Button variant="link" onClick={() => setCurrentScreen(1)}>Already signed up? Login</Button>
      </div>
    </div>,

    // Verification Screen
    <div key="verify" className={`p-6 space-y-6 ${isDarkMode ? 'bg-gray-900 text-gray-200' : 'bg-white text-black'}`}>
      <Button variant="ghost" className="p-0" onClick={() => setCurrentScreen(2)}>Back</Button>
      <div>
        <h2 className="text-2xl font-bold mb-2">Check your mail</h2>
        <p className={isDarkMode ? 'text-gray-400' : 'text-muted-foreground'}>We've sent a confirmation link to {email}. Please check your email and click on the link to verify your account.</p>
      </div>
      <div className="text-center">
        <Button variant="link" onClick={() => setCurrentScreen(1)}>Return to Login</Button>
      </div>
    </div>,

    // Home Screen with Updated Tabs
    <div key="home" className={`flex flex-col h-full ${isDarkMode ? 'bg-gray-900 text-gray-200' : 'bg-white text-black'}`}>
      {!isFullscreen && <Header />}
      <div className="flex-1 overflow-y-auto relative">
        <TabContent />
      </div>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        style={{ display: 'none' }}
        accept=".txt,.pdf"
        multiple
      />
    </div>
  ]

  return (
    <ErrorBoundary fallback={<div>Something went wrong</div>}>
      <div className={`max-w-md mx-auto border rounded-xl shadow-lg overflow-hidden ${isDarkMode ? 'bg-gray-900 text-gray-200' : 'bg-white text-black'}`}>
        <div className="h-[600px] bg-background relative">
          {screens[currentScreen]}
          {isProfileMenuOpen && (
            <ProfileMenu />
          )}
          {currentProfileScreen && (
            <div className={`absolute inset-0 ${isDarkMode ? 'bg-gray-900' : 'bg-white'} z-50`}>
              {currentProfileScreen === 'UserAccount' && <UserAccountScreen />}
              {currentProfileScreen === 'Subscription' && <SubscriptionScreen />}
              {currentProfileScreen === 'Settings' && <SettingsScreen />}
              {currentProfileScreen === 'ContactUs' && <ContactUsScreen />}
              {currentProfileScreen === 'AboutUs' && <AboutUsScreen />}
            </div>
          )}
        </div>
      </div>
    </ErrorBoundary>
  )
}

function NavItem({ icon, label, isActive, onClick }: { icon: React.ReactNode; label: string; isActive: boolean; onClick: () => void }) {
  return (
    <div
      className={`flex flex-col items-center justify-center cursor-pointer px-3 py-1 ${
        isActive ? 'opacity-100' : 'opacity-50'
      }`}
      onClick={onClick}
    >
      {icon}
      <span className="text-xs mt-1">{label}</span>
    </div>
  )
}