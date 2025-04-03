import { IDL, query, update, caller } from "azle";

// Define interface types for better type safety
interface Course {
  id: number;
  title: string;
  description: string;
}

interface Progress {
  lessonsCompleted: number;
  quizzesPassed: number;
  points: number;
}

interface EnrollmentResult {
  success: boolean;
  message: string;
}

interface ProgressResult extends EnrollmentResult {
  newPoints: number;
}

interface UserProgressItem {
  courseId: number;
  title: string;
  lessonsCompleted: number;
  quizzesPassed: number;
  points: number;
}
interface UserProfile {
  principal: string;
  totalPoints: number;
  enrolledCourses: number[];
}

interface Milestone {
  threshold: number;
  bonusPoints: number;
}

export default class {
  // Class properties
  private greeting: string = "Hello,";
  private count: number = 9999;

  // Static list of available courses
  private courses: Course[] = [
    { id: 1, title: "Math 101", description: "Introductory Mathematics" },
    { id: 2, title: "History 101", description: "Overview of World History" },
    {
      id: 3,
      title: "Computer Science 101",
      description: "Basics of Computing",
    },
  ];

  // Storage for user data - all indexed by principal
  private userCourses: Record<string, number[]> = {};
  private userProgress: Record<string, Record<number, Progress>> = {};
  private userPoints: Record<string, number> = {};

  // Constants for point calculations
  private readonly LESSON_POINT_VALUE = 10;
  private readonly QUIZ_POINT_VALUE = 20;

  @query([], IDL.Int32)
  getCount(): number {
    return this.count;
  }

@update(
  [], // No parameters needed if removing name
  IDL.Record({
    success: IDL.Bool,
    message: IDL.Text,
    principal: IDL.Text,
  })
)
registerUser(): {
  success: boolean;
  message: string;
  principal: string;
} {
  try {
    const userPrincipal = caller().toText();

    // Initialize user data structures
    this.userCourses[userPrincipal] = this.userCourses[userPrincipal] || [];
    this.userProgress[userPrincipal] = this.userProgress[userPrincipal] || {};
    this.userPoints[userPrincipal] = 0;

    return {
      success: true,
      message: "User registered successfully.",
      principal: userPrincipal,
    };
  } catch (error) {
    console.error("Error in registerUser:", error);
    return {
      success: false,
      message: "Registration failed due to an internal error.",
      principal: "",
    };
  }
}
 @query(
  [],
  IDL.Record({
    principal: IDL.Text,
    totalPoints: IDL.Int32,
    enrolledCourses: IDL.Vec(IDL.Int32),
  })
)
getUserProfile(): UserProfile {
  const userPrincipal = caller().toText();

  return {
    principal: userPrincipal,
    totalPoints: this.userPoints[userPrincipal] || 0,
    enrolledCourses: this.userCourses[userPrincipal] || [],
  };
}

  @query([IDL.Text], IDL.Text)
  greetUser(name: string): string {
    return `${this.greeting} ${name}!`;
  }

  @query(
    [],
    IDL.Vec(
      IDL.Record({
        id: IDL.Int32,
        title: IDL.Text,
        description: IDL.Text,
      })
    )
  )
  getCourses(): Course[] {
    return this.courses;
  }

  @update(
    [IDL.Int32],
    IDL.Record({
      success: IDL.Bool,
      message: IDL.Text,
    })
  )
  enrollInCourse(courseId: number): EnrollmentResult {
    try {
      const userPrincipal = caller().toText();

      // Check if user is registered
      if (!this.userCourses[userPrincipal]) {
        return {
          success: false,
          message: "User is not registered. Please register first.",
        };
      }
      

      // Check if the course exists
      const courseExists = this.courses.some(
        (course) => course.id === courseId
      );
      if (!courseExists) {
        return { success: false, message: "Course does not exist." };
      }

      // Initialize user data structures if they don't exist
      this.userCourses[userPrincipal] = this.userCourses[userPrincipal] || [];

      // Prevent duplicate enrollments
      if (this.userCourses[userPrincipal].includes(courseId)) {
        return { success: false, message: "Already enrolled in this course." };
      }

      // Enroll the user
      this.userCourses[userPrincipal].push(courseId);

      // Initialize the progress record
      this.userProgress[userPrincipal] = this.userProgress[userPrincipal] || {};
      this.userProgress[userPrincipal][courseId] = {
        lessonsCompleted: 0,
        quizzesPassed: 0,
        points: 0,
      };

      return { success: true, message: "Enrollment successful." };
    } catch (error) {
      console.error("Error in enrollInCourse:", error);
      return {
        success: false,
        message: "Enrollment failed due to an internal error.",
      };
    }
  }

  // @update(
  //   [IDL.Int32, IDL.Int32, IDL.Int32],
  //   IDL.Record({
  //     success: IDL.Bool,
  //     message: IDL.Text,
  //     newPoints: IDL.Int32,
  //     totalPoints: IDL.Int32,
  //   })
  // )
  // updateCourseProgress(
  //   courseId: number,
  //   lessonsCompleted: number,
  //   quizzesPassed: number
  // ): ProgressResult & { totalPoints: number } {
  //   try {
  //     const userPrincipal = caller().toText();

  //     // Check if user is registered
  //     if (!this.userNames[userPrincipal]) {
  //       return {
  //         success: false,
  //         message: "User is not registered. Please register first.",
  //         newPoints: 0,
  //         totalPoints: 0,
  //       };
  //     }

  //     // Check if user is enrolled
  //     if (
  //       !this.userCourses[userPrincipal] ||
  //       !this.userCourses[userPrincipal].includes(courseId)
  //     ) {
  //       return {
  //         success: false,
  //         message: "You are not enrolled in this course.",
  //         newPoints: 0,
  //         totalPoints: this.userPoints[userPrincipal] || 0,
  //       };
  //     }

  //     // Initialize if missing (shouldn't happen due to enrollment process)
  //     this.userProgress[userPrincipal] = this.userProgress[userPrincipal] || {};
  //     this.userProgress[userPrincipal][courseId] = this.userProgress[
  //       userPrincipal
  //     ][courseId] || {
  //       lessonsCompleted: 0,
  //       quizzesPassed: 0,
  //       points: 0,
  //     };

  //     const progress = this.userProgress[userPrincipal][courseId];

  //     // Calculate points
  //     const additionalLessonPoints = lessonsCompleted * this.LESSON_POINT_VALUE;
  //     const additionalQuizPoints = quizzesPassed * this.QUIZ_POINT_VALUE;
  //     const additionalPoints = additionalLessonPoints + additionalQuizPoints;

  //     // Update progress
  //     progress.lessonsCompleted += lessonsCompleted;
  //     progress.quizzesPassed += quizzesPassed;
  //     progress.points += additionalPoints;

  //     // Update total points
  //     this.userPoints[userPrincipal] =
  //       (this.userPoints[userPrincipal] || 0) + additionalPoints;

  //     return {
  //       success: true,
  //       message: "Progress updated.",
  //       newPoints: additionalPoints,
  //       totalPoints: this.userPoints[userPrincipal],
  //     };
  //   } catch (error) {
  //     console.error("Error in updateCourseProgress:", error);
  //     return {
  //       success: false,
  //       message: "Failed to update progress.",
  //       newPoints: 0,
  //       totalPoints: this.userPoints[caller().toText()] || 0,
  //     };
  //   }
  // }

  @query(
    [],
    IDL.Vec(
      IDL.Record({
        courseId: IDL.Int32,
        title: IDL.Text,
        lessonsCompleted: IDL.Int32,
        quizzesPassed: IDL.Int32,
        points: IDL.Int32,
      })
    )
  )
  getMyProgress(): UserProgressItem[] {
    const userPrincipal = caller().toText();

    if (!this.userProgress[userPrincipal]) {
      return [];
    }

    return Object.entries(this.userProgress[userPrincipal]).map(
      ([courseIdStr, progress]) => {
        const courseId = parseInt(courseIdStr);
        const course = this.courses.find((c) => c.id === courseId) || {
          title: "Unknown Course",
        };

        return {
          courseId,
          title: course.title,
          lessonsCompleted: progress.lessonsCompleted,
          quizzesPassed: progress.quizzesPassed,
          points: progress.points,
        };
      }
    );
  }

  @query([], IDL.Int32)
  getMyPoints(): number {
    return this.userPoints[caller().toText()] || 0;
  }

  @query(
  [IDL.Text],
  IDL.Record({
    totalPoints: IDL.Int32,
    enrolledCourses: IDL.Vec(IDL.Int32),
  })
)
getUserInfoByPrincipal(principalId: string): {
  totalPoints: number;
  enrolledCourses: number[];
} {
  return {
    totalPoints: this.userPoints[principalId] || 0,
    enrolledCourses: this.userCourses[principalId] || [],
  };
}

  private courseMilestones: Record<number, Milestone[]> = {
    1: [
      { threshold: 5, bonusPoints: 50 },
      { threshold: 10, bonusPoints: 100 },
    ],
    2: [
      { threshold: 3, bonusPoints: 30 },
      { threshold: 6, bonusPoints: 70 },
    ],
    // etc.
  };

  // Method to update milestones (could be called by an AI or admin)
  @update(
    [
      IDL.Int32,
      IDL.Vec(IDL.Record({ threshold: IDL.Int32, bonusPoints: IDL.Int32 })),
    ],
    IDL.Bool
  )
  updateMilestonesForCourse(
    courseId: number,
    newMilestones: Milestone[]
  ): boolean {
    try {
      // Optionally, add authorization logic here.
      this.courseMilestones[courseId] = newMilestones;
      return true;
    } catch (error) {
      console.error("Error updating milestones:", error);
      return false;
    }
  }

  // Example bonus calculation within course progress update
  updateCourseProgress(
    courseId: number,
    lessonsCompleted: number,
    quizzesPassed: number
  ): ProgressResult & { totalPoints: number } {
    const userPrincipal = caller().toText();
    // Calculate additional points
    const additionalLessonPoints = lessonsCompleted * this.LESSON_POINT_VALUE;
    const additionalQuizPoints = quizzesPassed * this.QUIZ_POINT_VALUE;
    const additionalPoints = additionalLessonPoints + additionalQuizPoints;

    // Update progress
    this.userProgress[userPrincipal][courseId].lessonsCompleted +=
      lessonsCompleted;
    this.userProgress[userPrincipal][courseId].quizzesPassed += quizzesPassed;
    this.userProgress[userPrincipal][courseId].points += additionalPoints;

    // Calculate bonus based on milestones
    const bonus = this.calculateBonus(
      courseId,
      this.userProgress[userPrincipal][courseId].lessonsCompleted
    );
    // Apply bonus to user's progress and total points
    this.userProgress[userPrincipal][courseId].points += bonus;
    this.userPoints[userPrincipal] += additionalPoints + bonus;

    // Return updated info including bonus
    return {
      success: true,
      message: "Progress updated.",
      newPoints: additionalPoints + bonus,
      totalPoints: this.userPoints[userPrincipal],
    };
  }

  private calculateBonus(courseId: number, currentLessons: number): number {
    const milestones = this.courseMilestones[courseId] || [];
    let bonus = 0;
    for (const milestone of milestones) {
      // For demonstration: if currentLessons exactly equals the threshold, apply bonus.
      // In a real app, you might want to detect crossing the threshold.
      if (currentLessons === milestone.threshold) {
        bonus += milestone.bonusPoints;
      }
    }
    return bonus;
  }
}
